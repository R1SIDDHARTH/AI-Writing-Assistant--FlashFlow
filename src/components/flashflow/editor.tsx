
"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { marked } from 'marked';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';

import { analyzeText } from "@/ai/flows/analyze-text";
import { rewriteTextTone } from "@/ai/flows/rewrite-text-tone";
import type { Suggestion } from "@/ai/schemas/analyze-text";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WandSparkles, Clipboard, LoaderCircle, FileText, Volume2, Play, Pause, Check, X, ArrowRight, BookText, RefreshCw, Mic, MicOff } from "lucide-react";
import { TiptapToolbar } from "./tiptap-toolbar";
import { FlashFlowLogo } from "../flashflow-logo";

const sampleText = "its a sunny day and i feel happy. i went to the store and buyed some milk. Then, I goed home. maybe i can write an email to my friend about it. very many more characteristics make this a good day. To that end, we recently started a research program to investigate, and prepare to navigate, model welfare, too?";

const suggestionCategories = ['All', 'Grammar', 'Spelling', 'Punctuation', 'Clarity', 'Vocabulary', 'Word Choice'] as const;
type SuggestionCategory = typeof suggestionCategories[number];

const toneOptions = ['Casual', 'Formal', 'Professional', 'Friendly', 'Academic', 'Formal Email', 'Informal Email'];
const voiceOptions = [
  { value: 'Algenib', label: 'Algenib (Female)' },
  { value: 'Achernar', label: 'Achernar (Male)' },
  { value: 'Canopus', label: 'Canopus (Male)' },
  { value: 'Rigel', label: 'Rigel (Female)' },
];

const categoryBadgeColors: Record<string, string> = {
  Grammar: '#4A90E2', // Blue
  Spelling: '#D0021B', // Red
  Punctuation: '#F5A623', // Orange
  'Word Choice': '#50E3C2', // Teal
  Clarity: '#9013FE', // Purple
  Vocabulary: '#7ED321', // Green
};

const categoryHighlightColors: Record<string, string> = {
  Grammar: 'rgba(74, 144, 226, 0.4)',
  Spelling: 'rgba(208, 2, 27, 0.4)',
  Punctuation: 'rgba(245, 166, 35, 0.4)',
  'Word Choice': 'rgba(80, 227, 194, 0.4)',
  Clarity: 'rgba(144, 19, 254, 0.4)',
  Vocabulary: 'rgba(126, 211, 33, 0.4)',
};


export function Editor() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenText, setRewrittenText] = useState('');
  const [selectedTone, setSelectedTone] = useState(toneOptions[0]);

  const [rewrittenAudioState, setRewrittenAudioState] = useState<'idle' | 'playing' | 'paused' | 'loading'>('idle');
  const [ttsAudioState, setTtsAudioState] = useState<'idle' | 'playing' | 'paused' | 'loading'>('idle');
  const [ttsText, setTtsText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(voiceOptions[0].value);

  const [characterCount, setCharacterCount] = useState(0);

  const [mainTab, setMainTab] = useState('suggestions');
  const [activeSuggestionTab, setActiveSuggestionTab] = useState<SuggestionCategory>('All');
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);


  const { toast } = useToast();
  const rewrittenAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing or paste your text here...' }),
      CharacterCount.configure(),
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: '',
    immediatelyRender: false, // Set explicitly to false
    editorProps: { attributes: { class: 'prose dark:prose-invert focus:outline-none max-w-full' } },
    onUpdate: ({ editor }) => {
      setCharacterCount(editor.storage.characterCount.characters());
      // When user types, analysis is no longer valid for the new text.
      if (suggestions.length > 0) {
        setSuggestions([]);
        editor.chain().focus().unsetHighlight().run();
      }
      if (rewrittenText) {
        if (rewrittenAudioRef.current) {
          rewrittenAudioRef.current.pause();
          rewrittenAudioRef.current.currentTime = 0;
          setRewrittenAudioState('idle');
        }
        setRewrittenText('');
      }
    },
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({ variant: 'destructive', title: 'Unsupported Browser', description: 'Speech recognition is not supported in this browser.' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if(finalTranscript) {
        editor?.commands.insertContent(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      toast({ variant: 'destructive', title: 'Speech Recognition Error', description: 'Something went wrong.' });
      setIsListening(false);
    };
    
    recognition.onend = () => {
        setIsListening(false);
    }

    recognitionRef.current = recognition;
  }, [editor, toast]);


  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (editor) {
        editor.commands.focus();
        recognitionRef.current?.start();
        setIsListening(true);
      }
    }
  };

  const handleAnalyze = async () => {
    const textToProcess = editor?.getHTML();
    if (!textToProcess || !editor?.getText().trim()) {
      toast({ title: "Oops!", description: "Please enter some text first.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setSuggestions([]);
    setActiveSuggestionTab('All');
    setMainTab('suggestions');

    // Clear previous highlights
    if (editor) {
      editor.chain().focus().unsetHighlight().run();
    }

    try {
      const result = await analyzeText({ text: editor.getText() });
      setSuggestions(result.suggestions);

      if (editor && result.suggestions.length > 0) {
        const { doc } = editor.state;
        const tr = editor.state.tr;
        
        const highlightedRanges: {from: number, to: number}[] = [];

        result.suggestions.forEach(suggestion => {
          const { original, category } = suggestion;
          const color = categoryHighlightColors[category];
          if (!color) return;

          const textToFind = original;
          
          doc.descendants((node, pos) => {
            if (!node.isText || !node.text) {
              return;
            }

            let index = -1;
            while ((index = node.text.indexOf(textToFind, index + 1)) !== -1) {
              const from = pos + index;
              const to = from + textToFind.length;

              const isOverlapping = highlightedRanges.some(range => 
                (from < range.to && to > range.from)
              );

              if (!isOverlapping) {
                tr.addMark(from, to, editor.schema.marks.highlight.create({ color }));
                highlightedRanges.push({ from, to });
              }
            }
          });
        });
        
        if (tr.docChanged || tr.storedMarksSet) {
            editor.view.dispatch(tr);
        }
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "An Error Occurred", description: "Something went wrong during analysis. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewrite = async () => {
    const textToProcess = editor?.getText();
     if (!textToProcess || !textToProcess.trim()) {
      toast({ title: "Oops!", description: "Please enter some text first.", variant: "destructive" });
      return;
    }

    if (rewrittenAudioRef.current) {
      rewrittenAudioRef.current.pause();
      rewrittenAudioRef.current.currentTime = 0;
      setRewrittenAudioState('idle');
    }

    setIsRewriting(true);
    setRewrittenText('');
    setMainTab('rewrite');

    try {
      const result = await rewriteTextTone({ text: textToProcess, tone: selectedTone });
      setRewrittenText(result.rewrittenText);
    } catch (error) {
       console.error(error);
      toast({ variant: "destructive", title: "An Error Occurred", description: "Something went wrong during rewrite. Please try again." });
    } finally {
      setIsRewriting(false);
    }
  };

  const handleCopyInput = () => {
    const textToCopy = editor?.getText();
    if (textToCopy?.trim()) {
      navigator.clipboard.writeText(textToCopy);
      toast({ title: "Copied!", description: "The input text has been copied." });
    }
  };
  
  const handleCopyRewrittenText = () => {
    if (rewrittenText.trim()) {
      navigator.clipboard.writeText(rewrittenText);
      toast({ title: "Copied!", description: "The rewritten text has been copied." });
    }
  };

  const handleSample = () => {
    editor?.commands.setContent(sampleText);
    editor?.commands.focus();
  };

  const handleApplySuggestion = useCallback((id: string, replacementText: string) => {
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion || !editor) return;

    const { original } = suggestion;
    let currentContent = editor.getHTML();
    
    // Create a regex to find the original text, but ensure it's not inside an HTML tag.
    // This is a simple approach; more complex HTML might need a proper parser.
    const textToFind = original.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?<!<[^>]*)${textToFind}(?![^<]*>)`);

    if(regex.test(currentContent)) {
        const updatedContent = currentContent.replace(regex, replacementText);
        editor.commands.setContent(updatedContent, true); 
        // Filter out the applied suggestion
        setSuggestions(prev => prev.filter(s => s.id !== id));
    } else {
        toast({ title: "Could not apply", description: "The original text was not found.", variant: "destructive" });
    }
  }, [editor, suggestions, toast]);


  const handleRejectSuggestion = (id: string) => {
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion || !editor) return;

    const { original, category } = suggestion;
    const { doc } = editor.state;
    const tr = editor.state.tr;
    const textToFind = original;
    const color = categoryHighlightColors[category];

    const markType = editor.schema.marks.highlight;

    doc.descendants((node, pos) => {
      if (!node.isText || !node.text) return;
      
      let index = -1;
      while ((index = node.text.indexOf(textToFind, index + 1)) !== -1) {
        const from = pos + index;
        const to = from + textToFind.length;

        const marks = node.marks.filter(mark => 
            mark.type === markType && mark.attrs.color === color
        );

        if (marks.length > 0) {
            tr.removeMark(from, to, markType);
        }
      }
    });

    if (tr.docChanged || tr.storedMarksSet) {
      editor.view.dispatch(tr);
    }
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleApplyAll = () => {
    if (!editor || suggestions.length === 0) return;

    let currentContent = editor.getHTML();
    const suggestionsToApply = activeSuggestionTab === 'All' ? suggestions : filteredSuggestions;

    suggestionsToApply.forEach(suggestion => {
        const textToFind = suggestion.original.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(?<!<[^>]*)${textToFind}(?![^<]*>)`);
        if (regex.test(currentContent)) {
            currentContent = currentContent.replace(regex, suggestion.suggestion);
        }
    });

    editor.commands.setContent(currentContent, true);
    setSuggestions(prev => prev.filter(s => !suggestionsToApply.some(applied => applied.id === s.id)));
    toast({ title: "Suggestions applied!", description: "Your text has been updated." });
  };

  const handleSpeakRewrittenText = async () => {
    if (rewrittenAudioState === 'playing') {
      rewrittenAudioRef.current?.pause();
      setRewrittenAudioState('paused');
      return;
    }
    if (rewrittenAudioState === 'paused') {
      rewrittenAudioRef.current?.play();
      setRewrittenAudioState('playing');
      return;
    }

    if (!rewrittenText.trim()) {
        toast({ variant: "destructive", title: "Nothing to speak", description: "There is no rewritten text to read out." });
        return;
    }

    setRewrittenAudioState('loading');
    try {
      const result = await textToSpeech({ text: rewrittenText });
      rewrittenAudioRef.current = new Audio(result.media);
      rewrittenAudioRef.current.play();
      setRewrittenAudioState('playing');
      rewrittenAudioRef.current.onended = () => setRewrittenAudioState('idle');
      rewrittenAudioRef.current.onerror = () => {
        toast({ variant: "destructive", title: "Audio Error", description: "Could not play audio." });
        setRewrittenAudioState('idle');
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "An Error Occurred", description: "Could not generate speech. Please try again." });
      setRewrittenAudioState('idle');
    }
  };

  const handleRewriteStartOver = () => {
    if (rewrittenAudioRef.current) {
        rewrittenAudioRef.current.pause();
        rewrittenAudioRef.current.currentTime = 0;
    }
    setRewrittenAudioState('idle');
    setRewrittenText('');
  };


  const handleTTS = async () => {
    if (ttsAudioState === 'playing') {
      ttsAudioRef.current?.pause();
      setTtsAudioState('paused');
      return;
    }
    if (ttsAudioState === 'paused') {
      ttsAudioRef.current?.play();
      setTtsAudioState('playing');
      return;
    }
    if (!ttsText.trim()) {
      toast({ variant: "destructive", title: "No text", description: "Please enter some text to synthesize." });
      return;
    }

    setTtsAudioState('loading');
    try {
      const result = await textToSpeech({ text: ttsText, voice: selectedVoice });
      ttsAudioRef.current = new Audio(result.media);
      ttsAudioRef.current.play();
      setTtsAudioState('playing');
      ttsAudioRef.current.onended = () => setTtsAudioState('idle');
      ttsAudioRef.current.onerror = () => {
        toast({ variant: "destructive", title: "Audio Error", description: "Could not play audio." });
        setTtsAudioState('idle');
      }
    } catch (error) {
       console.error(error);
      toast({ variant: "destructive", title: "An Error Occurred", description: "Could not generate speech. Please try again." });
      setTtsAudioState('idle');
    }
  };

  const handleStopTTS = () => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
    }
    setTtsAudioState('idle');
    setTtsText('');
  };

  const filteredSuggestions = useMemo(() => {
    if (activeSuggestionTab === 'All') return suggestions;
    return suggestions.filter(s => s.category === activeSuggestionTab);
  }, [activeSuggestionTab, suggestions]);

  const categoryCounts = useMemo(() => {
    const counts = suggestionCategories.reduce((acc, category) => {
        acc[category] = 0;
        return acc;
    }, {} as Record<SuggestionCategory, number>);

    suggestions.forEach(s => {
        if (counts[s.category] !== undefined) {
            counts[s.category]++;
        }
    });
    counts['All'] = suggestions.length;

    return counts;
  }, [suggestions]);

  const renderLoadingSkeleton = () => (
    <div className="space-y-4 p-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold font-headline">Your Text</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleToggleListening}>
                {isListening ? <MicOff className="text-red-500" /> : <Mic />}
                {isListening ? 'Stop' : 'Speak'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleSample}><FileText /> Sample</Button>
              <Button variant="outline" size="sm" onClick={handleCopyInput}><Clipboard /> Copy</Button>
            </div>
          </div>
          <div className="border rounded-lg bg-card text-card-foreground shadow-sm flex flex-col flex-1 min-h-[400px]">
            <div className="p-2 border-b">
              <TiptapToolbar editor={editor} />
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <EditorContent editor={editor}/>
            </div>
            <div className="p-4 border-t flex justify-between items-center gap-2 flex-wrap">
              <p className="text-sm text-muted-foreground">{characterCount} characters</p>
              <Button onClick={handleAnalyze} disabled={isLoading}>
                {isLoading ? <LoaderCircle className="animate-spin" /> : <WandSparkles />}
                Analyze Text
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold font-headline">Assistant</h2>
            </div>
            <Card className="shadow-lg border-border/60 flex-1 flex flex-col min-h-[400px]">
             <Tabs value={mainTab} onValueChange={setMainTab} className="flex-1 flex flex-col">
                <div className="p-4 border-b">
                   <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="suggestions" className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Suggestions</TabsTrigger>
                        <TabsTrigger value="rewrite" className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Rewrite</TabsTrigger>
                        <TabsTrigger value="speak" className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Text to Speech</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="suggestions" className="flex-1 flex flex-col mt-0">
                  {isLoading ? (
                      renderLoadingSkeleton()
                  ) : suggestions.length > 0 ? (
                    <>
                      <div className="p-4 border-b">
                          <Tabs value={activeSuggestionTab} onValueChange={(value) => setActiveSuggestionTab(value as SuggestionCategory)} className="w-full">
                              <TabsList className="bg-transparent p-0 h-auto flex gap-2 overflow-x-auto">
                                  {suggestionCategories.map(cat => (
                                    <TabsTrigger
                                      key={cat}
                                      value={cat}
                                      disabled={categoryCounts[cat] === 0 && cat !== 'All'}
                                      className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    >
                                      {cat} ({categoryCounts[cat] || 0})
                                    </TabsTrigger>
                                  ))}
                              </TabsList>
                          </Tabs>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-3">
                        {filteredSuggestions.map(s => (
                          <Card key={s.id} className="p-4 bg-background/50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div
                                    className="text-white text-xs font-semibold px-3 py-1 rounded-full capitalize"
                                    style={{ backgroundColor: categoryBadgeColors[s.category] }}
                                  >
                                    {s.category.toLowerCase()}
                                  </div>
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: categoryBadgeColors[s.category] }}
                                  />
                                </div>
                                <p className="text-red-500 line-through">{s.original}</p>
                                <div className="flex items-center gap-2 my-1">
                                    <ArrowRight className="inline-block text-muted-foreground h-4 w-4"/>
                                    <p className="inline text-green-600 font-medium">{s.suggestion}</p>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">{s.explanation}</p>

                                {s.alternatives && s.alternatives.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-sm font-medium mb-1 text-muted-foreground">Alternatives:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {s.alternatives.map((alt, index) => (
                                        <Button
                                          key={`${s.id}-alt-${index}`}
                                          variant="outline"
                                          size="sm"
                                          className="h-auto py-1 px-2 text-xs"
                                          onClick={() => handleApplySuggestion(s.id, alt)}
                                        >
                                          {alt}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0 ml-2">
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleApplySuggestion(s.id, s.suggestion)}><Check size={16}/></Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleRejectSuggestion(s.id)}><X size={16}/></Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                      <div className="p-4 border-t bg-card">
                        <Button className="w-full" onClick={handleApplyAll} disabled={filteredSuggestions.length === 0}>Apply All {activeSuggestionTab !== 'All' ? activeSuggestionTab : ''} Suggestions</Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground flex items-center justify-center h-full p-4">
                      <p>Your AI-powered suggestions will appear here after you click "Analyze".</p>
                    </div>
                  )}
                </TabsContent>
                 <TabsContent value="rewrite" className="flex-1 flex flex-col mt-0">
                    <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center flex-wrap">
                        <Select value={selectedTone} onValueChange={setSelectedTone}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Select a tone" />
                            </SelectTrigger>
                            <SelectContent>
                                {toneOptions.map(tone => <SelectItem key={tone} value={tone}>{tone}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                            <Button onClick={handleRewrite} disabled={isRewriting}>
                                {isRewriting ? <LoaderCircle className="animate-spin"/> : <BookText />}
                                Rewrite
                            </Button>
                            <Button onClick={handleSpeakRewrittenText} size="icon" variant="ghost" disabled={!rewrittenText || isRewriting || rewrittenAudioState === 'loading'}>
                                {rewrittenAudioState === 'loading' ? <LoaderCircle className="animate-spin size-5"/> : (rewrittenAudioState === 'playing' ? <Pause className="size-5"/> : (rewrittenAudioState === 'paused' ? <Play className="size-5"/> : <Volume2 className="size-5"/>))}
                                <span className="sr-only">Speak rewritten text</span>
                            </Button>
                            <Button onClick={handleRewriteStartOver} size="icon" variant="ghost" disabled={!rewrittenText && rewrittenAudioState === 'idle'}>
                                <RefreshCw className="size-5" />
                                <span className="sr-only">Start over rewrite</span>
                            </Button>
                             <Button onClick={handleCopyRewrittenText} size="icon" variant="ghost" disabled={!rewrittenText || isRewriting}>
                                <Clipboard className="size-5" />
                                <span className="sr-only">Copy rewritten text</span>
                            </Button>
                        </div>
                    </div>
                     {isRewriting ? (
                        renderLoadingSkeleton()
                    ) : rewrittenText ? (
                        <div
                            className="flex-1 overflow-y-auto p-6 prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: marked.parse(rewrittenText) }}
                        />
                    ) : (
                        <div className="text-center text-muted-foreground flex items-center justify-center h-full p-4">
                            <p>Select a tone and click "Rewrite" to transform your text.</p>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="speak" className="flex-1 flex flex-col mt-0">
                    <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center flex-wrap">
                        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Select a voice" />
                            </SelectTrigger>
                            <SelectContent>
                                {voiceOptions.map(voice => <SelectItem key={voice.value} value={voice.value}>{voice.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button onClick={handleTTS} disabled={ttsAudioState === 'loading'} className="flex-1">
                                {ttsAudioState === 'loading' ? <LoaderCircle className="animate-spin"/> : (ttsAudioState === 'playing' ? <Pause /> : <Play />)}
                                {ttsAudioState === 'playing' ? 'Pause' : (ttsAudioState === 'paused' ? 'Resume' : 'Play')}
                            </Button>
                            <Button onClick={handleStopTTS} variant="outline" className="flex-1">
                                <RefreshCw /> Start Over
                            </Button>
                        </div>
                    </div>
                    <div className="p-4 flex-1">
                        <Textarea
                            value={ttsText}
                            onChange={(e) => setTtsText(e.target.value)}
                            placeholder="Type or paste text here to convert to speech..."
                            className="h-full resize-none text-base"
                        />
                    </div>
                </TabsContent>
              </Tabs>
            </Card>
        </div>
      </div>
    </div>
  );
}
