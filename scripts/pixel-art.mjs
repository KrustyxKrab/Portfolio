#!/usr/bin/env node
// Usage: node scripts/pixel-art.mjs --width 2560 --height 768 --out /tmp/hamburg
// Resume an edited project: node scripts/pixel-art.mjs --input drawing.pixel.json --out /tmp/final
import {writeFile,readFile} from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
import {hamburg,composite,serialize,deserialize} from '../public/pixel-studio/engine.js';
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i+=2){if(!['--width','--height','--seed','--out','--input'].includes(args[i])||!args[i+1])throw Error('Optionen: --width N --height N --seed N --out PFAD --input PROJEKT.json');options[args[i].slice(2)]=args[i+1];}
const project=options.input?deserialize(await readFile(options.input,'utf8')):hamburg(Number(options.width||1280),Number(options.height||384),Number(options.seed||4199));
const out=options.out||'/tmp/hamburg',pixels=composite(project),{width,height,palette}=project;
function crc32(buffer){let c=0xffffffff;for(let b of buffer){c^=b;for(let n=0;n<8;n++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(type,data){let tag=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([tag,data])));return Buffer.concat([size,tag,data,crc]);}
const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=3;
const rgb=Buffer.from(palette.flatMap((s,i)=>i?[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)]:[0,0,0]));
const rows=Buffer.alloc((width+1)*height);for(let y=0;y<height;y++)rows.set(pixels.subarray(y*width,(y+1)*width),y*(width+1)+1);
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('PLTE',rgb),chunk('tRNS',Buffer.from(palette.map((_,i)=>i?255:0))),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
await writeFile(`${out}.png`,png);await writeFile(`${out}.pixel.json`,serialize(project));console.log(`${width} × ${height} echte Pixel → ${out}.png + ${out}.pixel.json`);
