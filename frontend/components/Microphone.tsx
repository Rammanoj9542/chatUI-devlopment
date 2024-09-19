'use client'
import { useState, useEffect, useRef } from "react";
import { IconMic, IconActiveMic, IconSun, IconMoon, IconDownload } from "./ui/icons";
import { NormalButton } from '@/components/ui/button'
import Constants from "../lib/utils/Constants";
import { useTranscriber } from "../lib/hooks/useTranscriber";
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { ring2 } from 'ldrs'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from '@/components/ui/tooltip'
import { lineWobble } from 'ldrs'

lineWobble.register()
ring2.register()

function getMimeType() {
    const types = [
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
        "audio/wav",
        "audio/aac",
    ];
    for (let i = 0; i < types.length; i++) {
        if (MediaRecorder.isTypeSupported(types[i])) {
            return types[i];
        }
    }
    return undefined;
}

export default function Microphone({
    setInput, setIsStt, isStt, recording, setRecording, input, buttonRef, show
}: {
    setInput: (value: string) => void
    setIsStt: (value: boolean) => void
    isStt: boolean
    setRecording?: (value: boolean) => void
    recording: boolean
    input?: any
    buttonRef: any
    show: boolean
}) {
    // const { onKeyDown } = useEnterSubmit();
    // const {autoSend} = autoSubmit();
    const { theme } = useTheme()

    const transcriber = useTranscriber();

    const [duration, setDuration] = useState(0);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [audioData, setAudioData] = useState<
        | {
            buffer: AudioBuffer;
            url: string;
            mimeType: string;
        }
        | undefined
    >(undefined);
    // 
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [audioBlob, setAudioBlob] = useState(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const animationFrameRef = useRef(null);
    const silenceStartRef = useRef(null);
    //   
    useEffect(() => {
        let chunks = transcriber.output?.chunks ?? [];
        var output = chunks
            .map((chunk) => chunk.text)
            .join("")
            .trim();
        setInput(output)
        setIsStt(false);
        if (!transcriber.isBusy && output) {
            buttonRef.current.click();
            chunks = []
        }
    }, [transcriber.output])



    const resetAudio = () => {
        setAudioData(undefined);
    };

    const setAudioFromRecording = async (data: Blob) => {
        resetAudio();
        const blobUrl = URL.createObjectURL(data);
        const fileReader = new FileReader();

        fileReader.onloadend = async () => {
            try {
                const audioCTX = new AudioContext({
                    sampleRate: Constants.SAMPLING_RATE,
                });

                const arrayBuffer = fileReader.result as ArrayBuffer;

                const decoded = await audioCTX.decodeAudioData(arrayBuffer);

                setAudioData({
                    buffer: decoded,
                    url: blobUrl,
                    mimeType: data.type,
                });
                transcriber.start(decoded);
            } catch (error) {
                console.error('Error decoding audio data:', error);
            }
        };

        fileReader.onerror = (error) => {
            console.error('Error reading file:', error);
        };

        fileReader.readAsArrayBuffer(data);

    };

    useEffect(() => {
        const initRecorder = async () => {
            if (!streamRef.current) {
                streamRef.current = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
            }
            const mimeType = getMimeType();
            const mediaRecorder = new MediaRecorder(streamRef.current, {
                mimeType,
            });
            setMediaRecorder(mediaRecorder);
            mediaRecorderRef.current = mediaRecorder;

            let audioContext = new AudioContext();
            let audioSource = audioContext.createMediaStreamSource(streamRef.current);
            let analyser = audioContext.createAnalyser();

            audioSource.connect(analyser);
            analyser.fftSize = 256;
            let bufferLength = analyser.frequencyBinCount;
            let dataArray = new Uint8Array(bufferLength);

            analyserRef.current = analyser;
            dataArrayRef.current = dataArray;

            mediaRecorder.ondataavailable = (e) => {
                setAudioFromRecording(e.data);
                setAudioChunks((prev) => [...prev, e.data]);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: 'audio/wav' });
                setAudioBlob(blob);
                setAudioChunks([]);
                cancelAnimationFrame(animationFrameRef.current);
            };
        };

        initRecorder();
    }, [audioChunks]);

    const startRecording = () => {
        transcriber.onInputChange()
        setRecordedBlob(null);
        setRecording(true);
        mediaRecorder.start();
        silenceStartRef.current = null;
        detectSilence();
    };

    const stopRecording = () => {
        setRecording(false);
        mediaRecorder.stop();
        setIsStt(true)
    };

    const detectSilence = () => {
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;

        analyser.getByteFrequencyData(dataArray);
        let average = dataArray.reduce((sum, value) => sum + value) / dataArray.length;

        if (average < 30) {  // Adjust this threshold as needed
            if (silenceStartRef.current === null) {
                silenceStartRef.current = Date.now();
            } else if (Date.now() - silenceStartRef.current > 3000) {  // 3 seconds of silence
                stopRecording();
                return;
            }
        } else {
            silenceStartRef.current = null;
        }

        animationFrameRef.current = requestAnimationFrame(detectSilence);
    };

    useEffect(() => {
        let stream: MediaStream | null = null;

        if (recording) {
            const timer = setInterval(() => {
                setDuration((prevDuration) => prevDuration + 1);
            }, 1000);

            return () => {
                clearInterval(timer);
            };
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [recording]);

    const handleToggleRecording = () => {
        if (!recording && !isStt) {
            startRecording();
        }
        else {
            stopRecording()
        }
    };
    return (
        < >
            <Tooltip>
                <TooltipTrigger asChild>
                    <NormalButton
                        variant="outline"
                        size="icon"
                        className={cn("top-[14px] size-8 rounded-full bg-background sm:left-4", {
                            'cursor-not-allowed': isStt,
                        })}
                        onClick={handleToggleRecording}
                        type='button'
                        disabled={show}
                    >
                        {
                            recording ? (
                                <div className="active-mic-container" >
                                    <IconActiveMic />
                                    <div className="size-6 ring"></div>
                                </div>
                            ) : isStt ? (<>{transcriber.progressItems.length > 0 && (<div className="size-6" >
                                <l-line-wobble
                                    size="25"
                                    stroke="2"
                                    bg-opacity="0.1"
                                    speed="1.5"
                                    color={theme?.includes('dark') ? 'white' : 'black'}
                                ></l-line-wobble>
                            </div>
                            )}
                                {transcriber.isModelLoading && transcriber.progressItems.length === 0 && (<div className="size-6" >
                                    <l-ring-2
                                        size="20"
                                        stroke="2"
                                        stroke-length="0.25"
                                        bg-opacity="0.1"
                                        speed="0.8"
                                        color={theme?.includes('dark') ? 'white' : 'black'}
                                    ></l-ring-2>
                                </div>
                                )}
                                {!transcriber.isModelLoading && transcriber.progressItems.length === 0 && (<div className="size-6" >
                                    <l-dot-stream
                                        size="30"
                                        speed="2"
                                        color={theme?.includes('dark') ? 'white' : 'black'}
                                    ></l-dot-stream>

                                </div>
                                )}
                            </>
                            ) : (
                                <div className="size-6 pl-1.5" >
                                    <IconMic />
                                </div>
                            )
                        }
                        <span className="sr-only">Tap to Start</span>
                    </NormalButton>
                </TooltipTrigger>
                <TooltipContent>{recording ? 'Tap to Stop ' : isStt ? (<>{transcriber.progressItems.length > 0 && 'Model Downloading'}{transcriber.progressItems.length === 0 && transcriber.isModelLoading && 'Model Loading'}{transcriber.progressItems.length === 0 && !transcriber.isModelLoading && 'Processing'}</>) : 'Tap to Speak'}</TooltipContent>
            </Tooltip>
        </>
    );
}
