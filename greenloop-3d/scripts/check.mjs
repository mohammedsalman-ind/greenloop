import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {materials,filterMaterials,savings,chapterState} from '../src/journey-data.js';
import {createBeamGeometry} from '../src/scene-engine.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=await readFile(resolve(root,'dist/index.html'),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,'IDs must be unique');
const scenes=[...html.matchAll(/<section[^>]+data-index="(\d+)"/g)].map(x=>+x[1]);
assert.deepEqual(scenes,Array.from({length:13},(_,i)=>i),'All thirteen chapters must be present in order');
for(const match of html.matchAll(/data-go="(\d+)"/g))assert.ok(+match[1]>=0&&+match[1]<13,'Chapter navigation target out of range');
for(const match of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)){
  if(match[1].endsWith('.zip'))continue;
  await access(resolve(root,'dist',match[1]));
}
for(const item of materials)await access(resolve(root,'dist/assets',item.image));
assert.ok(html.includes('class="india-outline"')&&html.includes('data-city="Delhi"'),'Network SVG is included in the standalone build');
assert.equal(filterMaterials({query:' S355 '})[0]?.id,'steel');
assert.equal(filterMaterials({location:'Delhi, NCR',condition:'good',availability:'now',quantity:'small'}).length,1);
assert.equal(filterMaterials({material:'steel',location:'Mumbai'}).length,0);
assert.deepEqual(filterMaterials({quantity:'large'}).map(x=>x.id),['glass','concrete']);
assert.equal(filterMaterials({availability:'later'})[0]?.id,'concrete');
assert.equal(savings(65000,38000,2.4).total,64800);
assert.equal(savings(65000,38000,0).total,0);
assert.ok(savings(100,200,2).total<0,'Higher reclaimed cost must not show a positive saving');
assert.equal(savings(-1,20,1),null);assert.equal(savings(NaN,20,1),null);
for(let position=0;position<=13;position+=.01){
  const normal=scenes.map(i=>chapterState(position,i,13));
  assert.ok(normal.reduce((sum,x)=>sum+x.opacity,0)>.99,'Scroll transition must not leave an empty stage');
  assert.equal(scenes.filter(i=>chapterState(position,i,13,true).opacity===1).length,1,'Reduced motion presents exactly one chapter');
}
const beam=createBeamGeometry();
assert.ok([...beam.attributes.position.array,...beam.attributes.normal.array].every(Number.isFinite),'3D vertices and normals must be finite');
assert.ok(beam.boundingBox.max.x-beam.boundingBox.min.x>6.2,'Beam length includes beveled end faces');
assert.ok(beam.boundingSphere.radius<3.3,'Beam fits the intended camera framing');beam.dispose();
console.log('Passed: 13-chapter navigation, local assets, SVG map, marketplace combinations, cost calculation, continuous scroll states, reduced motion and 3D geometry.');
