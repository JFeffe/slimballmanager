import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captureForms,restoreForms,captureLayout,restoreLayout} from '../dist/view-state.js';
const form=id=>({getAttribute:()=>id});
const field=(f,name,value,type='select-one')=>({form:f,name,value,type,tagName:type==='select-one'?'SELECT':'INPUT',options:['','p1','p2','p3','p4'].map(value=>({value}))});
test('background update preserves each pitching slot, repeated controls and named-id forms independently',()=>{
 const a=form('rotation-form'),b=form('replace-form');b.id={value:'p1'};
 const old=[field(a,'pitcher','p2'),field(a,'pitcher','p1'),field(a,'pitcher','p4'),field(a,'pitcher',''),field(b,'id','p3','hidden')];
 const saved=captureForms({querySelectorAll:()=>old});
 const next=old.map(el=>({...el,value:'p1'}));restoreForms({querySelectorAll:()=>next},saved);
 assert.deepEqual(next.map(x=>x.value),old.map(x=>x.value));
 next[0].options=[{value:'p1'}];next[0].value='p1';restoreForms({querySelectorAll:()=>next},saved);assert.equal(next[0].value,'p1');
});
test('table horizontal scroll and expanded editor survive a screen refresh',()=>{
 const before={querySelectorAll:s=>s==='details'?[{open:true}]:[{scrollLeft:315,scrollTop:22}]};
 const scroll=[{scrollLeft:0,scrollTop:0}],details=[{open:false}];
 restoreLayout({querySelectorAll:s=>s==='details'?details:scroll},captureLayout(before));
 assert.deepEqual(scroll,[{scrollLeft:315,scrollTop:22}]);assert.equal(details[0].open,true);
});
test('keyboard focus returns to the actual third pitcher slot, not the first',async()=>{
 const {captureFocus,restoreFocus}=await import('../dist/view-state.js');
 const f=form('rotation-form'),old=Array.from({length:4},()=>field(f,'pitcher','p1'));
 old.forEach(el=>el.matches=()=>true);
 const saved=captureFocus({activeElement:old[2],querySelectorAll:()=>old});
 let focused=-1;const next=old.map((el,i)=>({...el,focus:()=>{focused=i;}}));
 restoreFocus({querySelectorAll:()=>next},saved);assert.equal(focused,2);
});
