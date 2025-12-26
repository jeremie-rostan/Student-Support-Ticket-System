import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const apiKey = formData.get('apiKey') as string;
    const speakerLabels = formData.get('speakerLabels') === 'true';
    const summarization = formData.get('summarization') === 'true';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 400 });
    }

    // Initialize AssemblyAI client
    const client = new AssemblyAI({
      apiKey: apiKey,
    });

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload the audio file
    const uploadUrl = await client.files.upload(buffer);

    // Configure transcription options
    const config: any = {
      audio_url: uploadUrl,
      speaker_labels: speakerLabels,
    };

    // Add summarization if requested
    if (summarization) {
      config.summarization = true;
      config.summary_model = 'informative';
      config.summary_type = 'bullets';
    }

    // Start transcription
    const transcript = await client.transcripts.transcribe(config);

    if (transcript.status === 'error') {
      return NextResponse.json(
        { error: transcript.error },
        { status: 500 }
      );
    }

    // Format response with speaker information
    const response: any = {
      text: transcript.text,
    };

    // Add speaker-separated utterances if speaker labels were requested
    if (speakerLabels && transcript.utterances) {
      response.utterances = transcript.utterances.map((utterance) => ({
        speaker: utterance.speaker,
        text: utterance.text,
        start: utterance.start,
        end: utterance.end,
        confidence: utterance.confidence,
      }));
    }

    // Add summary if requested
    if (summarization && transcript.summary) {
      response.summary = transcript.summary;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('AssemblyAI transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Transcription failed' },
      { status: 500 }
    );
  }
}
