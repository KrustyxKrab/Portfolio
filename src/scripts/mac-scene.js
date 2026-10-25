import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { applyLook } from './mac-look.js';

// The supplied model was normalized to ten units tall during offline conversion.
// The glass is a tilted, curved surface (top edge z 3.076, bottom edge z 3.483, side midpoints on that plane).
// The flat HTML plane runs through those edges: its corners sit on the glass rim.
const DISPLAY = { width: 5.4524, height: 4.1055, y: 1.76017 };
const glassZ = y => 3.48318 - (y + .29261) * .09925;
DISPLAY.zTop = glassZ(DISPLAY.y + DISPLAY.height / 2);DISPLAY.zBottom = glassZ(DISPLAY.y - DISPLAY.height / 2);
const UI_WIDTH = 1120;
const UI_HEIGHT = UI_WIDTH * DISPLAY.height / DISPLAY.width;

// Glass outline in logical px: sides bulge (barrel) to full width at mid height, top/bottom rows are inset, corners rounded.
function glassPath(W,H,i=10,r=44){
  return `path('M${i+r} 0H${W-i-r}Q${W-i} 0 ${W-i} ${r}Q${W+i} ${H/2} ${W-i} ${H-r}Q${W-i} ${H} ${W-i-r} ${H}H${i+r}Q${i} ${H} ${i} ${H-r}Q${-i} ${H/2} ${i} ${r}Q${i} 0 ${i+r} 0Z')`;
}

function homography(p) {
  const [a,b,c,d]=p;
  const dx1=b.x-c.x,dx2=d.x-c.x,dx3=a.x-b.x+c.x-d.x;
  const dy1=b.y-c.y,dy2=d.y-c.y,dy3=a.y-b.y+c.y-d.y;
  const det=dx1*dy2-dx2*dy1;
  const g=Math.abs(det)>1e-8?(dx3*dy2-dx2*dy3)/det:0;
  const h=Math.abs(det)>1e-8?(dx1*dy3-dx3*dy1)/det:0;
  return {a:b.x-a.x+g*b.x,b:d.x-a.x+h*d.x,c:a.x,d:b.y-a.y+g*b.y,e:d.y-a.y+h*d.y,f:a.y,g,h};
}


export async function createMac(element) {
  // The full supplied set is normalized around the monitor, with embedded textures.
  const {scene:model}=await new GLTFLoader().loadAsync('/models/macintosh/computer.glb');
  const canvas=element.querySelector('[data-mac-canvas]');
  const screen=element.querySelector('[data-screen]');
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();scene.add(model);
  const assemblyBounds=new THREE.Box3().setFromObject(model);
  const assemblyCorners=[];
  model.traverse(object=>{
    if(!object.isMesh)return;
    const bounds=new THREE.Box3().setFromObject(object);
    for(const x of [bounds.min.x,bounds.max.x])
      for(const y of [bounds.min.y,bounds.max.y])
        for(const z of [bounds.min.z,bounds.max.z])
          assemblyCorners.push(new THREE.Vector3(x,y,z));
  });
  const camera=new THREE.PerspectiveCamera(32,14.4/10.4,.1,100);
  const look=applyLook({renderer,scene,model,bounds:assemblyBounds});

  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const precise=matchMedia('(pointer: fine)');
  // Every visit and reload zooms in from the whole set, right as the loader fades.
  const intro=!reduced.matches;
  let disposed=false,frame=0,last=0,projection,firstFrame;
  // wide: 0 = working view on the screen, 1 = whole set. Tweened by time, so re-toggling continues from the current value.
  let wide=intro?1:0,tween=null;
  const goal=()=>tween?tween.to:wide;
  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  function tweenTo(to,duration,delay=0,force=false){
    if(goal()===to&&!force)return;
    const span=Math.abs(to-wide);
    tween=reduced.matches||!span?null:{from:wide,to,start:performance.now()+delay,duration:duration*span};
    if(!tween)wide=to;
    element.dispatchEvent(new CustomEvent('viewchange',{detail:{overview:to===1}}));
    requestRender();
  }
  const current={yaw:0,pitch:0},target={yaw:0,pitch:0};
  const center=new THREE.Vector3(0,DISPLAY.y,(DISPLAY.zTop+DISPLAY.zBottom)/2);
  const orbitCenter=center.clone();
  const wideYaw=.07,widePitch=.14,wideFit=.94,workYaw=.012,workPitch=.004,fitWidth=.94,fitHeight=.83;
  const direction=new THREE.Vector3(Math.sin(wideYaw)*Math.cos(widePitch),Math.sin(widePitch),Math.cos(wideYaw)*Math.cos(widePitch));
  const right=new THREE.Vector3(Math.cos(wideYaw),0,-Math.sin(wideYaw));
  const up=new THREE.Vector3().crossVectors(direction,right);
  let wideFrame;
  function overviewFrame(aspect,tan){
    if(wideFrame?.aspect===aspect)return wideFrame;
    const anchor=assemblyBounds.getCenter(new THREE.Vector3());
    const fit=()=>Math.max(...assemblyCorners.map(point=>{
      const relative=point.clone().sub(anchor);
      return relative.dot(direction)+Math.max(Math.abs(relative.dot(right))/(tan*aspect*wideFit),Math.abs(relative.dot(up))/(tan*wideFit));
    }));
    let radius=fit();
    // Center the projected kit, rather than the empty space behind its cables.
    for(let pass=0;pass<3;pass++){
      const xs=[],ys=[];
      for(const point of assemblyCorners){
        const relative=point.clone().sub(anchor),depth=radius-relative.dot(direction);
        xs.push(relative.dot(right)/depth);ys.push(relative.dot(up)/depth);
      }
      anchor.addScaledVector(right,(Math.min(...xs)+Math.max(...xs))/2*radius);
      anchor.addScaledVector(up,(Math.min(...ys)+Math.max(...ys))/2*radius);
      radius=fit();
    }
    return wideFrame={aspect,anchor,radius};
  }
  screen.style.width=`${UI_WIDTH}px`;screen.style.height=`${UI_HEIGHT}px`;
  screen.style.clipPath=glassPath(UI_WIDTH,UI_HEIGHT);screen.style.left='0';screen.style.top='0';screen.style.transformOrigin='0 0';
  screen.toLocalPoint=(clientX,clientY)=>{
    if(!projection)return{x:clientX,y:clientY};
    const rect=element.getBoundingClientRect(),X=clientX-rect.left,Y=clientY-rect.top;
    const {a,b,c,d,e,f,g,h}=projection,A=X*g-a,B=X*h-b,C=Y*g-d,D=Y*h-e,det=A*D-B*C;
    return{x:((c-X)*D-B*(f-Y))/det*UI_WIDTH,y:(A*(f-Y)-(c-X)*C)/det*UI_HEIGHT};
  };
  function alignScreen(width,height){
    const {width:w,height:h,y,zTop,zBottom}=DISPLAY;
    const points=[[-w/2,y+h/2,zTop],[w/2,y+h/2,zTop],[w/2,y-h/2,zBottom],[-w/2,y-h/2,zBottom]].map(point=>{
      const p=new THREE.Vector3(...point).project(camera);
      return{x:(p.x+1)*width/2,y:(1-p.y)*height/2};
    });
    projection=homography(points);
    const {a,b,c,d,e,f,g,h:hh}=projection;
    screen.style.transform=`matrix3d(${a/UI_WIDTH},${d/UI_WIDTH},0,${g/UI_WIDTH},${b/UI_HEIGHT},${e/UI_HEIGHT},0,${hh/UI_HEIGHT},0,0,1,0,${c},${f},0,1)`;
  }
  function render(now){
    frame=0;if(disposed||document.hidden){last=0;return}
    const dt=last?Math.min((now-last)/1000,.1):1/60;
    // Frame-rate independent soft follow of the pointer (time constant ~0.25s).
    const k=1-Math.exp(-dt/.25);
    current.yaw+=(target.yaw-current.yaw)*k;current.pitch+=(target.pitch-current.pitch)*k;
    if(Math.abs(target.yaw-current.yaw)<.00001)current.yaw=target.yaw;
    if(Math.abs(target.pitch-current.pitch)<.00001)current.pitch=target.pitch;
    if(tween){
      const t=THREE.MathUtils.clamp((now-tween.start)/tween.duration,0,1);
      wide=tween.from+(tween.to-tween.from)*ease(t);
      if(t===1){wide=tween.to;tween=null}
    }
    const {width,height}=element.getBoundingClientRect();
    const dpr=Math.min(devicePixelRatio||1,1.6,Math.sqrt(2_100_000/(width*height)));
    if(renderer.getPixelRatio()!==dpr)renderer.setPixelRatio(dpr);
    const size=renderer.getSize(new THREE.Vector2());
    if(size.x!==Math.round(width)||size.y!==Math.round(height)){renderer.setSize(Math.round(width),Math.round(height),false);camera.aspect=width/height;camera.updateProjectionMatrix()}
    // Fit the real display, not the full case, into a comfortable working view.
    const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    const workingDistance=Math.max(DISPLAY.height/(2*tan*fitHeight),DISPLAY.width/(2*tan*camera.aspect*fitWidth));
    // Fit every supplied object, including the mouse and cables, in the wide view.
    const wideView=overviewFrame(camera.aspect,tan);
    const distance=THREE.MathUtils.lerp(workingDistance,wideView.radius,wide);
    orbitCenter.copy(center).lerp(wideView.anchor,wide);
    const yaw=THREE.MathUtils.lerp(workYaw,wideYaw,wide)+current.yaw;
    const pitch=THREE.MathUtils.lerp(workPitch,widePitch,wide)+current.pitch;
    // Only the camera moves: the supplied computer stays anchored in world space.
    camera.position.set(orbitCenter.x+Math.sin(yaw)*Math.cos(pitch)*distance,orbitCenter.y+Math.sin(pitch)*distance,orbitCenter.z+Math.cos(yaw)*Math.cos(pitch)*distance);
    camera.lookAt(orbitCenter);camera.updateMatrixWorld(true);
    renderer.render(scene,camera);alignScreen(width,height);element.dataset.renderer='webgl';
    firstFrame?.();firstFrame=undefined;
    const moving=tween||current.yaw!==target.yaw||current.pitch!==target.pitch;
    last=moving?now:0;if(moving)requestRender();
  }
  function requestRender(){if(!frame&&!disposed)frame=requestAnimationFrame(render)}
  function onPointer(event){
    if(reduced.matches||!precise.matches||event.buttons||document.hidden)return;
    const rect=element.getBoundingClientRect();
    target.yaw=THREE.MathUtils.clamp((event.clientX-rect.left)/rect.width*2-1,-1,1)*.009;
    target.pitch=THREE.MathUtils.clamp((event.clientY-rect.top)/rect.height*2-1,-1,1)*.005;
    requestRender();
  }
  function reset(){target.yaw=target.pitch=0;requestRender()}
  function freeze(){target.yaw=current.yaw;target.pitch=current.pitch;requestRender()}
  function onVisible(){if(!document.hidden)requestRender()}
  // In the whole-set view the desktop is tiny: any press on it returns to the screen instead.
  function onOverviewPress(event){
    if(wide<=.5||event.target.closest('[data-view-toggle]'))return;
    event.stopPropagation();if(event.type==='click'){event.preventDefault();tweenTo(0,700,0,true)}
  }
  function setOverview(overview){tweenTo(overview?1:0,1000);return goal()===1}
  const observer=new ResizeObserver(requestRender);observer.observe(element);
  document.addEventListener('pointermove',onPointer,{passive:true});document.addEventListener('pointerdown',freeze,{passive:true});
  for(const type of ['pointerdown','click'])element.addEventListener(type,onOverviewPress,true);
  document.documentElement.addEventListener('pointerleave',reset);document.addEventListener('visibilitychange',onVisible);reduced.addEventListener('change',reset);
  const onLost=event=>{event.preventDefault();screen.style.cssText='';element.removeAttribute('data-renderer');element.dispatchEvent(new CustomEvent('macscenelost'))};
  canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',requestRender);
  const rendered=new Promise(resolve=>firstFrame=resolve);
  requestRender();
  if(intro)tweenTo(0,1800,150);
  await rendered;
  return{
    toggleOverview:()=>setOverview(goal()!==1),setOverview,isOverview:()=>goal()===1,
    dispose(){
      disposed=true;cancelAnimationFrame(frame);observer.disconnect();
      document.removeEventListener('pointermove',onPointer);document.removeEventListener('pointerdown',freeze);document.removeEventListener('visibilitychange',onVisible);
      for(const type of ['pointerdown','click'])element.removeEventListener(type,onOverviewPress,true);
      document.documentElement.removeEventListener('pointerleave',reset);reduced.removeEventListener('change',reset);
      canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',requestRender);
      look.dispose();
      const materials=new Set(),textures=new Set();
      scene.traverse(object=>{object.geometry?.dispose();if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m))});
      materials.forEach(material=>{for(const value of Object.values(material))if(value?.isTexture)textures.add(value);material.dispose()});textures.forEach(t=>t.dispose());renderer.dispose();
      screen.style.cssText='';delete screen.toLocalPoint;element.removeAttribute('data-renderer');
    }
  };
}
