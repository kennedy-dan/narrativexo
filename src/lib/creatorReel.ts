export async function exportCreatorReelWebM({ lines = [], width = 1080, height = 1920, msPerSlide = 1200 }:{lines:string[];width?:number;height?:number;msPerSlide?:number;}){
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const stream = (canvas as any).captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  const ready = new Promise<Blob>(res => recorder.onstop = () => res(new Blob(chunks, { type: 'video/webm' })));
  recorder.start();

  function drawCentered(text:string){
    ctx.fillStyle = '#111827';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = '#F9FAFB';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 64px Inter, Arial, sans-serif';
    const lines = wrapText(ctx, text, width * 0.8);
    const totalH = lines.length * 80;
    lines.forEach((l, i)=> ctx.fillText(l, width/2, height/2 - totalH/2 + i*80));
  }

  function wrapText(ctx:CanvasRenderingContext2D, text:string, maxWidth:number){
    const words = text.split(' ');
    const lines:string[] = [];
    let line = '';
    for(const w of words){
      const test = line ? line + ' ' + w : w;
      if(ctx.measureText(test).width < maxWidth){ line = test; }
      else { lines.push(line); line = w; }
    }
    if(line) lines.push(line);
    return lines;
  }

  for(const t of lines){
    drawCentered(t);
    await new Promise(r => setTimeout(r, msPerSlide));
  }
  recorder.stop();
  const blob = await ready;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'creator_reel.webm'; a.click();
  URL.revokeObjectURL(url);
}
