import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const server=spawn('python3',['-m','http.server','6006','--directory','storybook-brand'],{stdio:'inherit'});
let browser;
try {
 for(let i=0;i<60;i++){try{if((await fetch('http://localhost:6006/index.html')).ok)break;}catch{}await new Promise(resolve=>setTimeout(resolve,300));}
 browser=await chromium.launch();await mkdir('screenshots',{recursive:true});const report=[];
 for(const theme of ['dark','light'])for(const [device,width] of [['desktop',1440],['tablet',768],['mobile',390]]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
  await page.goto(`http://localhost:6006/iframe.html?id=foundation-brand-and-tokens--${theme}&viewMode=story`,{waitUntil:'networkidle'});
  const section=page.getByRole('region',{name:'Approved brand and tokens'});await section.waitFor();await page.evaluate(()=>document.fonts.ready);
  const marks=page.getByRole('img',{name:'TruthBounty'});if(await marks.count()!==5)throw Error('Brand accessible names differ');
  for(const mark of await marks.all()){
   const svg=mark.locator('svg:visible');const box=await svg.boundingBox();const view=await svg.getAttribute('viewBox');const [, ,w,h]=view.split(' ').map(Number);
   if(!box||Math.abs(box.width/box.height-w/h)>.02||box.width<16||box.x+box.width>width+1)throw Error('Brand distortion or overflow');
  }
  const result=await section.evaluate(element=>{
   function rgb(color){const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const context=canvas.getContext('2d');context.fillStyle=color;context.fillRect(0,0,1,1);return [...context.getImageData(0,0,1,1).data].slice(0,3).map(value=>value/255);}
   function luminance(values){return values.map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);}
   function contrast(a,b){const x=luminance(rgb(a)),y=luminance(rgb(b));return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
   const style=getComputedStyle(element),button=element.querySelector('button'),buttonStyle=getComputedStyle(button);const ratios={button:contrast(buttonStyle.color,buttonStyle.backgroundColor)};
   for(const role of ['success','warning','danger','info','action-text','ink-muted']){const span=document.createElement('span');span.style.color=`var(--${role})`;element.append(span);ratios[role]=contrast(getComputedStyle(span).color,style.backgroundColor);span.remove();}
   return{ratios,motion:style.getPropertyValue('--tb-motion-feedback').trim(),font:getComputedStyle(element.querySelector('svg text')).fontFamily,fonts:[...document.fonts].map(font=>({family:font.family,status:font.status}))};
  });
  if(Object.values(result.ratios).some(value=>value<4.5))throw Error('Contrast below AA: '+JSON.stringify(result));
  if(result.motion!=='1ms')throw Error('Reduced motion tokens not applied');
  if(!/geist/i.test(result.font))throw Error('Wordmark does not use Geist');
  const button=section.getByRole('button');await button.focus();await page.keyboard.press('Space');await page.keyboard.press('Space');
  if(parseFloat(await button.evaluate(element=>getComputedStyle(element).outlineWidth))<2)throw Error('No visible keyboard focus');
  await page.screenshot({path:`screenshots/${theme}-${device}.png`,fullPage:true});
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);if(scroll>width)throw Error(`Zoom overflow ${theme}/${device}: ${scroll}`);
  const bounds=await button.boundingBox();if(!bounds||bounds.x<0||bounds.x+bounds.width>width+1)throw Error('Zoom clips theme action');
  await page.screenshot({path:`screenshots/${theme}-${device}-zoom.png`,fullPage:true});
  await page.emulateMedia({forcedColors:'active'});await button.focus();await page.keyboard.press('Space');
  if(!await section.getByRole('status').isVisible())throw Error('Status lost under forced colours');
  report.push({theme,device,width,...result,zoom:'200%',scrollWidth:scroll,keyboard:true,forcedColors:true});await page.close();
 }
 await writeFile('screenshots/report.json',JSON.stringify(report,null,2));console.log('Brand browser, AA, motion, reflow and keyboard checks passed');
}finally{await browser?.close();server.kill('SIGTERM');}
