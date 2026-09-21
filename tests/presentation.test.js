import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LOGOS} from '../dist/logos.js';
import {themeTokens,contrast,onColor,matchMoment} from '../dist/presentation.js';
test('all ten team palettes retain readable text on primary and accent backgrounds',()=>{
 for(const logo of LOGOS){const vars=Object.fromEntries(themeTokens(logo.id).split(';').map(v=>v.split(':')));assert.equal(vars['--team-main'],logo.colors[0]);assert(contrast(vars['--ink'],vars['--paper'])>=4.5);for(const c of logo.colors)assert(contrast(c,onColor(c))>=4.5);}
});
test('highlight classification distinguishes real key events without inventing a double play',()=>{
 const e={type:'1B',half:0,runs:0,score:[0,0]};assert.equal(matchMoment(e),null);
 assert.equal(matchMoment({...e,type:'HR',runs:1}),'home-run');assert.equal(matchMoment({...e,type:'HR',runs:4}),'grand-slam');
 assert.equal(matchMoment({...e,type:'DP'}),'double-play');assert.equal(matchMoment({...e,type:'T',outs:2}),null);
 assert.equal(matchMoment({...e,type:'3B'}),'triple');assert.equal(matchMoment({...e,runs:2,score:[2,1]},{score:[0,1]}),'lead');
 assert.equal(matchMoment({...e,runs:1,score:[2,1]},{score:[1,1]}),'lead');assert.equal(matchMoment({...e,runs:1,score:[1,1]},{score:[0,1]}),null);
 assert.equal(matchMoment(e,null,true),'victory');
});
