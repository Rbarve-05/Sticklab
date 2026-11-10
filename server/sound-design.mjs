import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const RATE = 22050;
const clamp = (v) => Math.max(-1, Math.min(1, v));
function tone(samples, at, seconds, hz, gain, noise = false) {
  const start = Math.max(0, Math.floor(at * RATE));
  const count = Math.min(Math.floor(seconds * RATE), samples.length - start);
  for (let i=0;i<count;i++) {
    const t=i/RATE, fade=Math.min(1,i/100)*Math.max(0,1-i/count);
    const wave=noise ? (Math.random()*2-1) : Math.sin(2*Math.PI*hz*t)+.18*Math.sin(4*Math.PI*hz*t);
    samples[start+i] += wave*gain*fade;
  }
}
function whoosh(s,at){tone(s,at,.38,140,.16,true);tone(s,at+.04,.28,75,.1);}
function hit(s,at){tone(s,at,.28,62,.28);tone(s,at,.1,320,.1,true);}
function ping(s,at){tone(s,at,.14,880,.12);tone(s,at+.12,.18,1175,.1);}
function wav(samples){
  const bytes=samples.length*2, out=Buffer.alloc(44+bytes);
  out.write("RIFF",0);out.writeUInt32LE(36+bytes,4);out.write("WAVE",8);out.write("fmt ",12);
  out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(RATE,24);
  out.writeUInt32LE(RATE*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write("data",36);out.writeUInt32LE(bytes,40);
  for(let i=0;i<samples.length;i++)out.writeInt16LE(Math.round(clamp(samples[i]) * 32767),44+i*2);
  return out;
}
export async function createSoundDesign(story, outputPath) {
  const duration=story.scenes.reduce((sum,s)=>sum+s.durationSeconds,0);
  const samples=new Float32Array(Math.ceil(duration*RATE));
  let cursor=0;
  story.scenes.forEach((scene,index)=>{
    if(index>0)whoosh(samples,cursor);
    if(scene.dialogue?.length)ping(samples,cursor+Math.min(.65,scene.durationSeconds*.16));
    if(index===story.scenes.length-1)hit(samples,Math.max(0,duration-.65));
    cursor+=scene.durationSeconds;
  });
  let peak=0;for(const sample of samples)peak=Math.max(peak,Math.abs(sample));
  if(peak>.9){const gain=.9/peak;for(let i=0;i<samples.length;i++)samples[i]*=gain;}
  await mkdir(dirname(outputPath),{recursive:true});await writeFile(outputPath,wav(samples));
  return {durationSeconds:duration,sampleRate:RATE};
}
