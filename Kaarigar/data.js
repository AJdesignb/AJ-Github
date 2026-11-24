/* kārigaṛ — game data.
   Edit this file to change crafts, materials and special cards.
   Placeholder text marked "Coming soon" is waiting for verified research. */
const MATS={wool:{n:'Wool',c:'#E07A2E'},felt:{n:'Felt',c:'#D81B60'},thread:{n:'Thread',c:'#0E7C86'},silk:{n:'Silk thread',c:'#C9A227'},mulmul:{n:'Mulmul',c:'#A48BD6'},khadar:{n:'Khadar',c:'#8C7A5B'},cotton:{n:'Cotton',c:'#7E8FA6'},indigo:{n:'Indigo',c:'#2F3A9E'},block:{n:'Wood block',c:'#8B5A2B'},copper:{n:'Copper',c:'#B5562B'},charcoal:{n:'Charcoal',c:'#4A4A57'}};
const RES_COUNTS={wool:5,felt:3,thread:3,silk:5,mulmul:3,khadar:3,cotton:3,indigo:5,block:3,copper:7,charcoal:3};
const CRAFTS={
 paabu:{name:'Paabu Boots',region:'Ladakh',panel:'#EBC24A',coins:5,need:{wool:2,felt:1,thread:1}},
 chamba:{name:'Chamba Rumaal',region:'Himachal Pradesh',panel:'#D98577',coins:6,need:{silk:2,mulmul:1,khadar:1}},
 ajrakh:{name:'Ajrakh',region:'Kutch, Gujarat',panel:'#9DBFC0',coins:5,need:{cotton:1,indigo:2,block:1}},
 taamba:{name:'Taamba Copperware',region:'Pune, Maharashtra',panel:'#E59A4E',coins:6,need:{copper:3,charcoal:1}}};
const INFO=['What it is','How it’s made','Who makes it','Their story','Where to find it'];
const SPECIALS={
 flood:{name:'Monsoon Flood',kind:'d',eff:'Lose half your resource cards, rounded down.',art:'a flooded workshop'},
 middleman:{name:'The Middleman',kind:'d',eff:'Give 2 resource cards of your choice to the next player.',art:'a middleman taking a cut'},
 factory:{name:'Factory Copy',kind:'d',eff:'Everyone loses 1 resource card.',art:'a stack of cheap copies'},
 shortage:{name:'Material Shortage',kind:'d',eff:'Name a material. Everyone discards all cards of that type.',art:'an empty market stall'},
 apprentice:{name:'Apprentice Leaves',kind:'d',eff:'Choose one unfinished craft. It fades and costs you 2 coins.',art:'an apprentice walking away'},
 family:{name:'Family Hands',kind:'h',eff:'Draw 3 resource cards and keep 2.',art:'family working together'},
 master:{name:'Master’s Guidance',kind:'h',eff:'Take any one card from either discard pile.',art:'a master teaching'},
 gi:{name:'GI Tag',kind:'h',eff:'Keep this. It blocks the next disruption that hits you.',art:'a GI certificate'}};
const PCOL=['#D98A9A','#C9932A','#9AA6DE','#A3B06A'];
const FADE=2;
