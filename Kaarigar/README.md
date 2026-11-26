# kārigaṛ

A pass-and-play card game about the crafts of India. Step into the role of a kārigar (artisan): collect the materials for a craft, finish it before it fades, and learn the story behind it.

MA thesis project, Interaction Design & Interactive Art, Cal State East Bay.

**Play it:** https://ajdesignb.github.io/AJ-Github/Kaarigar/ (works best on a phone)

## How to play

- 2–4 players share one phone and pass it between turns.
- Everyone secretly holds a craft card that lists the materials it needs. There are 10 crafts, each twice in the craft deck.
- On your turn, make one move by dragging (or tapping) a card from the table:
  - the **resource deck** to your hand: draw 2, keep 1, discard 1 to pile A or B
  - the **top of pile A or B** to your hand
  - the **craft deck** to your crafts row (hold up to 3)
- Special cards hide in the resource deck: disruptions like Monsoon Flood and The Middleman, and helpers like Family Hands and the GI Tag.
- Gather every material on a craft card to complete it and earn its coins.
- After your move, the table stays visible with what changed highlighted; then pass the phone.
- When the resource deck runs out, the round finishes. Unfinished crafts fade and cost 2 coins each. Most coins wins.

## Files

| File | What it holds |
| --- | --- |
| `index.html` | The page shell |
| `styles.css` | Colours, type, the floral frame and all layout |
| `data.js` | Crafts, materials, deck counts and special cards. Edit this to change the game's content |
| `game.js` | Game rules, screens and drag & drop |
| `sound.js` | Sound effects for drawing, discarding and helper cards (synthesised, no audio files) |
| `assets/` | The animated toran banners (SVG) and the pass-the-phone illustration |

## Run it locally

Open `index.html` in a browser, or from this folder run `python3 -m http.server` and visit http://localhost:8000.

## Still to do

- Verified research for each craft: what it is, how it's made, who makes it, the artisan's story, where to find it
- A real fact on every special card
- Hand-drawn illustrations for craft cards, special cards and recognition medals
- Final material lists for each craft
