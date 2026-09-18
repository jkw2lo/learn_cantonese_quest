/* Cantonese Quest — curriculum data.
   Each entry: c=traditional character, s=simplified (only when it differs),
   p=jyutping, m=meaning, comp=components, pos=grammar tags, story=mnemonic,
   o=where it comes from, words=[[word,jyutping,meaning]], sent=[jyut,jyutping,en]

   Readings are the ones Cantonese speakers actually use, which is not always
   the one Unihan lists. Unihan gives a character's literary reading: 行 hang4,
   坐 zo6, 平 ping4. Spoken Cantonese says haang4, co5, peng4. Where the two
   part company this file follows the mouth, and tools/check-jyutping.mjs
   prints every divergence so the choice stays deliberate rather than accidental.

   Lives here rather than in app.js because srs.js needs it too, and srs.js is
   loaded without app.js by the smoke harness. One binding, one owner. */
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

const HQ = [];

/* ---------- Stage 1 · 打招呼 — nine phrases you can use on the way out of the first week: hello, good morning, good night, thank you, sorry, goodbye ---------- */
HQ.push(
{c:"你",p:"nei5",m:"you",comp:["人"],pos:["pron"],
 story:"nei5, where Mandarin says nǐ. Cantonese keeps the older -ei ending that Mandarin flattened.",
 o:"A person (亻) standing opposite. Some Hong Kong writing uses 妳 for a female 'you', but 你 covers everyone.",
 words:[["你哋","nei5 dei6","you (plural)"],["你好","nei5 hou2","hello"]],
 sent:["你好嗎？","nei5 hou2 maa3","How are you?"]},
{c:"好",p:"hou2",m:"good; well; very",comp:["女","子"],pos:["adj","adv"],
 story:"Does double duty: 好 on its own is 'good', and in front of an adjective it means 'very' — 好大 is 'very big'.",
 o:"A woman (女) with her child (子). The oldest surviving sense of 'things going well', and unchanged in every Chinese language since.",
 words:[["你好","nei5 hou2","hello"],["好食","hou2 sik6","tasty"],["好多","hou2 do1","a lot"]],
 sent:["呢個好好食。","ni1 go3 hou2 hou2 sik6","This is delicious."]},
{c:"我",p:"ngo5",m:"I; me",comp:["手"],pos:["pron"],
 story:"Starts with the ng- sound that trips up every learner: let the sound come down your nose before the vowel. 我 ngo5, not o5.",
 o:"A hand (手) gripping a serrated blade — 'the one holding the weapon' became 'me'. The same character in every Chinese language; only the sound changed.",
 words:[["我哋","ngo5 dei6","we; us"],["我嘅","ngo5 ge3","my; mine"]],
 sent:["我係學生。","ngo5 hai6 hok6 saang1","I'm a student."]},
{c:"係",p:"hai6",m:"to be; yes",comp:["人","系"],pos:["v"],
 story:"The Cantonese 'is'. Where Mandarin says 是 shì, Cantonese says 係 hai6 — and 係 on its own is how you say yes.",
 o:"A person (亻) with 系, to connect. Mandarin uses 係 too, but only for 關係 (relationship); as the verb 'to be' it is Cantonese.",
 words:[["係唔係","hai6 m4 hai6","is it or isn't it?"],["唔係","m4 hai6","is not; no"]],
 sent:["佢係老師。","keoi5 hai6 lou5 si1","She's a teacher."]},
{c:"唔",p:"m4",m:"not; no",comp:["口","吾"],pos:["adv"],
 story:"A whole word with no vowel in it — just a hummed m, low and level. Put it in front of anything to negate it: 唔好, 唔係, 唔要.",
 o:"A mouth (口) with 吾 for the sound. Cantonese negates with 唔 where Mandarin uses 不; the two are not related and do not look alike.",
 words:[["唔係","m4 hai6","is not; no"],["唔好","m4 hou2","don't"],["唔要","m4 jiu3","don't want; no thanks"]],
 sent:["我唔係老師。","ngo5 m4 hai6 lou5 si1","I'm not a teacher."]},
{c:"該",p:"goi1",m:"ought to; should",comp:["言"],pos:["aux"],
 story:"On its own it means ought to. In practice it lives inside one phrase — 唔該 — which is the most useful thing in the language: 'please', 'thank you' and 'excuse me' at once.",
 o:"Speech (言) with 亥 for the sound. 唔該 literally reads 'not owed' — you have done me a kindness I have not repaid.",
 words:[["唔該","m4 goi1","please; thank you; excuse me"],["唔該晒","m4 goi1 saai3","thanks very much"]],
 sent:["唔該，一杯水。","m4 goi1 jat1 bui1 seoi2","Excuse me — a glass of water."]},
{c:"多",p:"do1",m:"many; much",comp:["夕"],pos:["adj"],
 story:"do1. Pair it with 幾 and you have the single most useful question in any shop: 幾多錢呀？",
 o:"Two evenings (夕) stacked — one night after another after another. Quantity drawn as repetition.",
 words:[["多謝","do1 ze6","thank you (for a gift)"],["好多","hou2 do1","a lot"],["多少","do1 siu2","amount"]],
 sent:["人好多呀。","jan4 hou2 do1 aa3","There are a lot of people."]},
{c:"謝",p:"ze6",m:"to thank",comp:["言","身"],pos:["v"],
 story:"Cantonese has two thank-yous and they are not interchangeable. 多謝 is for a gift or a compliment; 唔該 is for a service.",
 o:"Speech (言) with 射, to shoot, for the sound — words sent across to someone.",
 words:[["多謝","do1 ze6","thank you (for a gift)"],["多謝晒","do1 ze6 saai3","thank you very much"]],
 sent:["多謝你嘅禮物。","do1 ze6 nei5 ge3 lai5 mat6","Thank you for the present."]},
{c:"早",p:"zou2",m:"early; morning",comp:["日","十"],pos:["adj","n"],
 story:"早晨 zou2 san4 is 'good morning' — and in Hong Kong a bare 早晨 shouted across an office is the whole greeting.",
 o:"The sun (日) above a line: the sun just clear of the horizon. Early.",
 words:[["早晨","zou2 san4","good morning"],["好早","hou2 zou2","very early"],["早啲","zou2 di1","earlier"]],
 sent:["早晨！","zou2 san4","Good morning!"]},
{c:"晨",p:"san4",m:"morning",comp:["日"],pos:["n"],
 story:"You will hear it before you can read it. 早晨 zou2 san4 is shouted across offices, shops and lift lobbies all morning — it is the greeting, far more than 你好 is.",
 o:"The sun (日) over 辰, a time period. Dawn, as a fixed hour of the day rather than as a picture of light.",
 words:[["早晨","zou2 san4","good morning"]],
 sent:["早晨！","zou2 san4","Good morning!"]},
{c:"晚",p:"maan5",m:"evening; late",comp:["日","免"],pos:["n","adj"],
 story:"晚安 for goodnight, 晚飯 for dinner. The partner of 早 at the other end of the day.",
 o:"The sun (日) with 免 for the sound — the sun released, gone down.",
 words:[["晚安","maan5 on1","good night"],["晚飯","maan5 faan6","dinner"],["今晚","gam1 maan5","tonight"]],
 sent:["今晚食咩呀？","gam1 maan5 sik6 me1 aa3","What are we eating tonight?"]},
{c:"安",p:"on1",m:"peaceful; safe",comp:["女"],pos:["adj"],
 story:"Inside 晚安, goodnight. The character is a woman under a roof — the old picture of a household at rest.",
 o:"A woman (女) under a roof (宀). Safety drawn as shelter.",
 words:[["晚安","maan5 on1","good night"],["平安","ping4 on1","safe and sound"]],
 sent:["晚安，聽日見。","maan5 on1 ting1 jat6 gin3","Good night, see you tomorrow."]},
{c:"對",p:"deoi3",m:"correct; toward; a pair",comp:["寸"],pos:["adj","cov"],
 story:"You will meet it first in 對唔住 — sorry. Literally 'not able to face you'.",
 o:"A hand (寸) holding up a lamp-stand, offering it to someone. From 'facing' came 'matching', and from matching came 'correct'.",
 words:[["對唔住","deoi3 m4 zyu6","sorry"],["對面","deoi3 min6","opposite; across the way"]],
 sent:["對唔住，我遲咗。","deoi3 m4 zyu6 ngo5 ci4 zo2","Sorry, I'm late."]},
{c:"住",p:"zyu6",m:"to live; to stay",comp:["人","主"],pos:["v"],
 story:"Where you live, and also a tag meaning 'hold it there' — 等住 is 'wait and keep waiting'.",
 o:"A person (亻) beside 主, a lamp burning in a house. Where the lamp is lit is where you live.",
 words:[["住喺","zyu6 hai2","to live at"],["對唔住","deoi3 m4 zyu6","sorry"]],
 sent:["我住喺香港。","ngo5 zyu6 hai2 hoeng1 gong2","I live in Hong Kong."]},
{c:"再",p:"zoi3",m:"again; then",comp:[],pos:["adv"],
 story:"再見 is goodbye — literally 'see you again'. Cantonese speakers say it less than textbooks suggest; 拜拜 baai1 baai3 is far commoner.",
 o:"A drawing of a fish hung up twice over. Repetition, shown by doubling.",
 words:[["再見","zoi3 gin3","goodbye"],["再嚟","zoi3 lai4","come again"]],
 sent:["聽日再講啦。","ting1 jat6 zoi3 gong2 laa1","Let's talk again tomorrow."]},
{c:"見",p:"gin3",m:"to see; to meet",comp:["目"],pos:["v"],
 story:"An eye on legs — a person walking about with their eyes open. Meeting, not just looking.",
 o:"An eye (目) drawn large on top of a person (儿). Seeing as something a whole body does.",
 words:[["再見","zoi3 gin3","goodbye"],["見面","gin3 min6","to meet up"],["唔見","m4 gin3","to lose; to go missing"]],
 sent:["聽日見！","ting1 jat6 gin3","See you tomorrow!"]}
);

/* ---------- Stage 2 · 我哋 — people, and the particles that hold a cantonese sentence together ---------- */
HQ.push(
{c:"人",p:"jan4",m:"person",comp:[],pos:["n"],
 story:"A person walking, two legs mid-stride. jan4 — the j is an English y, so it sounds like 'yun'.",
 o:"A side view of a standing figure. Squeezed against a left edge it becomes 亻, which is inside 你, 佢 and 係.",
 words:[["人哋","jan4 dei6","other people; someone else"],["男人","naam4 jan2","man"],["大人","daai6 jan4","adult"]],
 sent:["嗰個人係邊個？","go2 go3 jan4 hai6 bin1 go3","Who is that person?"]},
{c:"個",p:"go3",m:"(general measure word)",comp:["人","固"],pos:["mw"],
 story:"Cantonese counts with a measure word between the number and the thing. 個 is the all-purpose one — when you don't know which to use, use 個.",
 o:"A person (亻) with 固 for the sound. Note the simplified form 个 is a different-looking character for the same word.",
 words:[["個人","go3 jan4","individual; personal"],["一個","jat1 go3","one (of something)"],["呢個","ni1 go3","this one"],["幾個","gei2 go3","how many"]],
 sent:["我要兩個。","ngo5 jiu3 loeng5 go3","I'd like two."]},
{c:"佢",p:"keoi5",m:"he; she; it",comp:["人","巨"],pos:["pron"],
 story:"One word for he, she and it — Cantonese never makes you guess someone's gender to refer to them. keoi5.",
 o:"A person (亻) beside 巨 for the sound. This character does not exist in Mandarin, which uses 他 and 她; 佢 is one of the first signs you are reading Cantonese and not Standard Chinese.",
 words:[["佢哋","keoi5 dei6","they; them"],["佢嘅","keoi5 ge3","his; hers; its"]],
 sent:["佢係我朋友。","keoi5 hai6 ngo5 pang4 jau5","He's my friend."]},
{c:"哋",p:"dei6",m:"(plural marker for people)",comp:["口","地"],pos:["part-pl"],
 story:"Stick it on a person-word and you have a crowd: 我哋, 你哋, 佢哋. It never attaches to anything that isn't a person.",
 o:"A mouth (口) marking a spoken word, beside 地 for the sound. Written Cantonese builds nearly all its particles this way, which is why so many of them have a 口 on the left.",
 words:[["我哋","ngo5 dei6","we; us"],["你哋","nei5 dei6","you (plural)"],["佢哋","keoi5 dei6","they; them"]],
 sent:["我哋去食飯。","ngo5 dei6 heoi3 sik6 faan6","We're going to eat."]},
{c:"嘅",p:"ge3",m:"(possessive / linking particle)",comp:["口","既"],pos:["part-str"],
 story:"Cantonese glue. 我嘅書 is my book, 大嘅 is the big one. Where Mandarin writes 的, Cantonese writes 嘅.",
 o:"A mouth (口) beside 既 for the sound — another particle built by putting a mouth next to a character that sounds right.",
 words:[["我嘅","ngo5 ge3","my; mine"],["你嘅","nei5 ge3","your; yours"],["好嘅","hou2 ge3","alright; OK"]],
 sent:["呢個係我嘅。","ni1 go3 hai6 ngo5 ge3","This one is mine."]},
{c:"咩",p:"me1",m:"what; (question particle)",comp:["口","羊"],pos:["part-q"],
 story:"Two jobs. On the end of a sentence it makes a surprised question — 係咩？'really?'. On its own it can mean 'what'.",
 o:"A mouth (口) with a sheep (羊) for the sound — the character was originally the noise a sheep makes.",
 words:[["係咩","hai6 me1","really?; is that so?"],["做咩","zou6 me1","why; what for"]],
 sent:["你做咩呀？","nei5 zou6 me1 aa3","What are you doing?"]},
{c:"呀",p:"aa3",m:"(softening sentence particle)",comp:["口","牙"],pos:["part"],
 story:"Cantonese leans on its final particles the way English leans on tone of voice. 呀 takes the edge off — a question without it can sound blunt.",
 o:"A mouth (口) with a tooth (牙) for the sound. Listed in dictionaries as aa1, but as the softener at the end of a sentence it is aa3.",
 words:[["係呀","hai6 aa3","yes; that's right"],["好呀","hou2 aa3","sure; sounds good"]],
 sent:["你去邊度呀？","nei5 heoi3 bin1 dou6 aa3","Where are you going?"]},
{c:"仔",p:"zai2",m:"son; boy; small one",comp:["人","子"],pos:["n"],
 story:"Everywhere in Hong Kong. On its own it is a son or a boy; stuck on the end of a word it shrinks it — 刀仔 is a little knife.",
 o:"A person (亻) with a child (子). Mandarin reads it zǎi and barely uses it; in Cantonese it is one of the most productive endings in the language.",
 words:[["仔女","zai2 neoi2","children"],["男仔","naam4 zai2","boy"],["細佬仔","sai3 lou2 zai2","little kid"]],
 sent:["佢有兩個仔。","keoi5 jau5 loeng5 go3 zai2","He has two sons."]},
{c:"女",p:"neoi5",m:"woman; female; daughter",comp:[],pos:["n"],
 story:"neoi5 — round your lips for the eo, somewhere between the vowels in 'her' and 'were'. It is the sound that marks Cantonese out.",
 o:"A figure kneeling with arms crossed, the ancient posture of a seated woman. It heads a large family of characters, 好 among them.",
 words:[["女仔","neoi5 zai2","girl"],["女人","neoi5 jan2","woman"],["仔女","zai2 neoi2","children"]],
 sent:["嗰個女仔係我妹。","go2 go3 neoi5 zai2 hai6 ngo5 mui6","That girl is my younger sister."]},
{c:"名",p:"meng2",m:"name",comp:["口","夕"],pos:["n"],
 story:"Two readings, and you need both: 個名 meng2 is the name you call someone, 名字 ming4 zi6 is the formal word. Everyday Cantonese uses meng2.",
 o:"A mouth (口) under the evening (夕) — in the dark you have to say who you are. The picture is three thousand years old and still legible.",
 words:[["個名","go3 meng2","(someone's) name"],["改名","goi2 meng2","to name; to rename"],["有名","jau5 meng2","famous"]],
 sent:["你叫咩名呀？","nei5 giu3 me1 meng2 aa3","What's your name?"]},
{c:"叫",p:"giu3",m:"to be called; to call",comp:["口","丩"],pos:["v"],
 story:"How you ask anyone's name: 你叫咩名呀？ — literally 'you are called what name?'. It also means to shout, and to order food.",
 o:"A mouth (口) with 丩, a twist of rope, for the sound. The mouth radical does what it always does: this is something you do out loud.",
 words:[["叫人","giu3 jan4","to call someone"],["叫做","giu3 zou6","to be called"],["叫嘢食","giu3 je5 sik6","to order food"]],
 sent:["我叫佢做阿明。","ngo5 giu3 keoi5 zou6 aa3 ming4","I call him Ah Ming."]},
{c:"有",p:"jau5",m:"to have; there is",comp:["月"],pos:["v"],
 story:"jau5. Its opposite is not 唔有 — Cantonese has a dedicated word, 冇 mou5, and 唔有 is simply wrong.",
 o:"A hand reaching for a piece of meat — the 月 here is 肉, flesh, not the moon. What is in your hand is what you have.",
 words:[["有冇","jau5 mou5","is there any?"],["有啲","jau5 di1","some; a bit"],["有名","jau5 meng2","famous"]],
 sent:["你有冇時間呀？","nei5 jau5 mou5 si4 gaan3 aa3","Do you have time?"]},
{c:"冇",p:"mou5",m:"to not have; there isn't",comp:["有"],pos:["v"],
 story:"Look at it beside 有: the same character with its two middle strokes taken out. The writing system rarely gets to be this neat.",
 o:"A Cantonese invention, made by hollowing out 有. It does not exist in Mandarin, which needs two characters (沒有) to say it.",
 words:[["冇嘢","mou5 je5","it's nothing; never mind"],["有冇","jau5 mou5","is there any?"],["冇問題","mou5 man6 tai4","no problem"]],
 sent:["我冇錢。","ngo5 mou5 cin2","I have no money."]}
);

/* ---------- Stage 3 · 一二三 — counting, and the 二 / 兩 distinction that catches everyone ---------- */
HQ.push(
{c:"一",p:"jat1",m:"one",comp:[],pos:["num"],
 story:"One stroke. The high flat first tone — hold it level, like the first note of a tune.",
 o:"The oracle-bone form three thousand years ago is identical to the one you write today. It has never needed to change.",
 words:[["一個","jat1 go3","one (of something)"],["一齊","jat1 cai4","together"],["第一","dai6 jat1","first"]],
 sent:["我要一杯茶。","ngo5 jiu3 jat1 bui1 caa4","I'd like a cup of tea."]},
{c:"二",p:"ji6",m:"two",comp:["一"],pos:["num"],
 story:"For counting aloud — 一、二、三. To count two *things* you need 兩, not 二. Getting that wrong is the commonest beginner slip.",
 o:"Two strokes for two. The lower line is drawn longer so it can't be mistaken for a badly spaced 一.",
 words:[["二十","ji6 sap6","twenty"],["二月","ji6 jyut6","February"],["第二","dai6 ji6","second"]],
 sent:["十二點食飯。","sap6 ji6 dim2 sik6 faan6","Lunch is at twelve."]},
{c:"三",p:"saam1",m:"three",comp:["一","二"],pos:["num"],
 story:"saam1, and the counting is literal until four, where the pattern gives up.",
 o:"Three stacked strokes. 四 breaks the run because four scratches in a row stopped being readable at a glance.",
 words:[["三個","saam1 go3","three (of something)"],["三月","saam1 jyut6","March"]],
 sent:["三個人去。","saam1 go3 jan4 heoi3","Three people are going."]},
{c:"四",p:"sei3",m:"four",comp:["囗"],pos:["num"],
 story:"sei3 — and it sounds uncomfortably close to 死 sei2, 'to die'. Hong Kong buildings skip the fourth floor for exactly this reason.",
 o:"Originally four strokes like 三 with one more. It was replaced early by a borrowed character meaning 'nostrils', which is the shape you write now.",
 words:[["四個","sei3 go3","four (of something)"],["四月","sei3 jyut6","April"]],
 sent:["我有四個。","ngo5 jau5 sei3 go3","I have four."]},
{c:"五",p:"ng5",m:"five",comp:["二"],pos:["num"],
 story:"Another word with no vowel — ng5, hummed at the back of the mouth. Cantonese is comfortable with syllables English would call impossible.",
 o:"Two lines with a cross between them: five as the midpoint between one and ten, counted on one hand.",
 words:[["五個","ng5 go3","five (of something)"],["五點","ng5 dim2","five o'clock"]],
 sent:["五個人食飯。","ng5 go3 jan4 sik6 faan6","Five people are eating."]},
{c:"六",p:"luk6",m:"six",comp:[],pos:["num"],
 story:"luk6 — ending in a hard k that stops the sound dead. Cantonese kept the -p, -t and -k endings Mandarin lost a thousand years ago.",
 o:"Borrowed for its sound from a character that drew a simple hut. The roof shape survives at the top.",
 words:[["六個","luk6 go3","six (of something)"],["六月","luk6 jyut6","June"]],
 sent:["六點見。","luk6 dim2 gin3","See you at six."]},
{c:"七",p:"cat1",m:"seven",comp:[],pos:["num"],
 story:"cat1 — spell it like the animal and you will say it right.",
 o:"Originally a horizontal line cut by a vertical one: 'to cut'. That sense moved to 切 and the shape was left to the number.",
 words:[["七個","cat1 go3","seven (of something)"],["七月","cat1 jyut6","July"]],
 sent:["七點鐘返工。","cat1 dim2 zung1 faan1 gung1","Work starts at seven."]},
{c:"八",p:"baat3",m:"eight",comp:[],pos:["num"],
 story:"The lucky one. baat3 rhymes with 發 faat3, 'to prosper', which is why Hong Kong number plates ending in 8 sell for a fortune.",
 o:"Two strokes dividing — the original sense was 'to split apart', which survives inside 分.",
 words:[["八個","baat3 go3","eight (of something)"],["八月","baat3 jyut6","August"]],
 sent:["八點開門。","baat3 dim2 hoi1 mun4","It opens at eight."]},
{c:"九",p:"gau2",m:"nine",comp:[],pos:["num"],
 story:"gau2, and it sounds like 狗 gau2, 'dog'. Cantonese is full of these near-misses, which is half of why it is so good for wordplay.",
 o:"A bent arm reaching, borrowed for its sound. Nine was the largest single digit and so came to mean 'many' in old texts.",
 words:[["九個","gau2 go3","nine (of something)"],["九龍","gau2 lung4","Kowloon"]],
 sent:["九點瞓覺。","gau2 dim2 fan3 gaau3","Bed at nine."]},
{c:"十",p:"sap6",m:"ten",comp:["一"],pos:["num"],
 story:"sap6. After ten, counting is arithmetic: 十一 is eleven, 二十 is twenty, 二十一 is twenty-one. No new words.",
 o:"A single vertical stroke meaning ten, with a dot added mid-shaft to tell it apart. The dot stretched into the horizontal bar.",
 words:[["十個","sap6 go3","ten (of something)"],["十月","sap6 jyut6","October"]],
 sent:["十個人喺度。","sap6 go3 jan4 hai2 dou6","Ten people are here."]},
{c:"兩",p:"loeng5",m:"two (of something)",comp:[],pos:["num"],
 story:"The one that catches everyone. Counting aloud uses 二; counting *things* uses 兩. Two cups is 兩杯, never 二杯.",
 o:"A picture of a balanced pair — two matched halves under one yoke. Which is exactly the distinction it still carries.",
 words:[["兩個","loeng5 go3","two (of something)"],["兩日","loeng5 jat6","two days"]],
 sent:["我要兩杯奶茶。","ngo5 jiu3 loeng5 bui1 naai5 caa4","Two milk teas, please."]},
{c:"幾",p:"gei2",m:"how many; quite",comp:[],pos:["part-q","adv"],
 story:"Two jobs again: 幾個 asks how many, but 幾好 means 'pretty good'. Cantonese uses it as a mild 'quite' all day long.",
 o:"A loom with threads, borrowed for its sound. The 'how many' sense has crowded out everything else in speech.",
 words:[["幾多","gei2 do1","how much; how many"],["幾點","gei2 dim2","what time"],["幾好","gei2 hou2","pretty good"]],
 sent:["幾多錢呀？","gei2 do1 cin2 aa3","How much is it?"]},
{c:"少",p:"siu2",m:"few; little",comp:["小"],pos:["adj"],
 story:"The opposite of 多. In a cha chaan teng you will hear 少甜 — less sugar — barked at the kitchen all day.",
 o:"小 (small) with one more stroke taken off it. Less, drawn as literally less.",
 words:[["少少","siu2 siu2","a little bit"],["少甜","siu2 tim4","less sugar"],["多少","do1 siu2","amount"]],
 sent:["少甜，唔該。","siu2 tim4 m4 goi1","Less sugar, please."]}
);

/* ---------- Stage 4 · 飲食 — ordering at a cha chaan teng: hot or iced, more or less sugar ---------- */
HQ.push(
{c:"食",p:"sik6",m:"to eat",comp:[],pos:["v"],
 story:"Cantonese kept the old word. Mandarin switched to 吃 chī centuries ago; 食 survives in Cantonese as the everyday verb.",
 o:"A lid over a full vessel of grain — a covered dish. The oldest food character there is.",
 words:[["食飯","sik6 faan6","to eat a meal"],["好食","hou2 sik6","tasty"],["食嘢","sik6 je5","to eat something"]],
 sent:["你食咗飯未呀？","nei5 sik6 zo2 faan6 mei6 aa3","Have you eaten yet?"]},
{c:"飲",p:"jam2",m:"to drink",comp:["食"],pos:["v"],
 story:"飲茶 jam2 caa4 is not just 'drink tea' — it is the whole institution of dim sum on a Sunday morning.",
 o:"The food radical (飠) with 欠, a person with their mouth open. Eating and drinking drawn as the same family.",
 words:[["飲茶","jam2 caa4","to drink tea; to go for dim sum"],["飲嘢","jam2 je5","to have a drink"],["飲水","jam2 seoi2","to drink water"]],
 sent:["我哋去飲茶啦。","ngo5 dei6 heoi3 jam2 caa4 laa1","Let's go for dim sum."]},
{c:"茶",p:"caa4",m:"tea",comp:["艸","木"],pos:["n"],
 story:"奶茶 naai5 caa4, Hong Kong milk tea, strained through a cloth that stains the colour of a silk stocking — hence 絲襪奶茶.",
 o:"Grass (艹) over a person over a tree — leaves picked by hand. Nearly every word for tea on earth descends from this character's sound.",
 words:[["奶茶","naai5 caa4","milk tea"],["飲茶","jam2 caa4","to drink tea; to go for dim sum"],["茶餐廳","caa4 caan1 teng1","cha chaan teng; HK diner"]],
 sent:["一杯凍奶茶，唔該。","jat1 bui1 dung3 naai5 caa4 m4 goi1","One iced milk tea, please."]},
{c:"水",p:"seoi2",m:"water",comp:[],pos:["n"],
 story:"seoi2 — that rounded eo again. In Hong Kong slang 水 also means money, which is why 磅水 means 'pay up'.",
 o:"A central current with droplets flying off both banks. On the left of a character it squeezes to 氵, three drops.",
 words:[["飲水","jam2 seoi2","to drink water"],["熱水","jit6 seoi2","hot water"],["汽水","hei3 seoi2","soft drink"]],
 sent:["唔該，一杯水。","m4 goi1 jat1 bui1 seoi2","A glass of water, please."]},
{c:"飯",p:"faan6",m:"rice; a meal",comp:["食"],pos:["n"],
 story:"Cooked rice, and by extension any meal. 食飯 covers breakfast, lunch and dinner without distinguishing them.",
 o:"The food radical (飠) with 反 for the sound. The staple, named after what it is made of.",
 words:[["食飯","sik6 faan6","to eat a meal"],["晚飯","maan5 faan6","dinner"],["炒飯","caau2 faan6","fried rice"]],
 sent:["我哋食飯先。","ngo5 dei6 sik6 faan6 sin1","Let's eat first."]},
{c:"麵",p:"min6",m:"noodles",comp:["麥"],pos:["n"],
 story:"雲吞麵 wan4 tan1 min6 — wonton noodles, the dish Hong Kong argues about most.",
 o:"Wheat (麥) with 面 for the sound. The simplified script merged it with 面 (face), so the same simplified character does both jobs.",
 words:[["雲吞麵","wan4 tan1 min6","wonton noodles"],["炒麵","caau2 min6","fried noodles"],["食麵","sik6 min6","to eat noodles"]],
 sent:["我要一碗雲吞麵。","ngo5 jiu3 jat1 wun2 wan4 tan1 min6","I'd like a bowl of wonton noodles."]},
{c:"包",p:"baau1",m:"bun; to wrap",comp:[],pos:["n","v"],
 story:"菠蘿包 bo1 lo4 baau1, the pineapple bun — named for its cracked golden top, and containing no pineapple whatsoever.",
 o:"A drawing of a womb with a child curled inside: something wrapped around something else.",
 words:[["菠蘿包","bo1 lo4 baau1","pineapple bun"],["麵包","min6 baau1","bread"],["包住","baau1 zyu6","to wrap up"]],
 sent:["一個菠蘿包，唔該。","jat1 go3 bo1 lo4 baau1 m4 goi1","One pineapple bun, please."]},
{c:"奶",p:"naai5",m:"milk",comp:["女"],pos:["n"],
 story:"In 奶茶 it is naai5. Careful — 奶奶 naai4 naai2 is a mother-in-law, and the tones are doing all the work.",
 o:"A woman (女) with 乃 for the sound. Named from where milk first comes from.",
 words:[["奶茶","naai5 caa4","milk tea"],["牛奶","ngau4 naai5","cow's milk"]],
 sent:["凍奶茶少甜。","dung3 naai5 caa4 siu2 tim4","Iced milk tea, less sugar."]},
{c:"糖",p:"tong4",m:"sugar",comp:["米"],pos:["n"],
 story:"tong4 is sugar; the same character read tong2 is a sweet you can hold. Cantonese uses tone where English would use a different word altogether.",
 o:"Rice (米) with 唐 for the sound — sugar was refined from grain syrup long before cane reached China.",
 words:[["白糖","baak6 tong4","white sugar"],["糖水","tong4 seoi2","sweet soup"]],
 sent:["唔要糖，唔該。","m4 jiu3 tong4 m4 goi1","No sugar, please."]},
{c:"凍",p:"dung3",m:"cold; iced",comp:["冫"],pos:["adj"],
 story:"The single most useful word at a cha chaan teng counter. 凍檸茶 is iced lemon tea; say 熱 instead and you get it hot.",
 o:"Ice (冫, water frozen) with 東 for the sound. The two-stroke 冫 is 氵 with a drop removed — water gone solid.",
 words:[["凍茶","dung3 caa4","iced tea"],["凍檸茶","dung3 ning4 caa4","iced lemon tea"],["好凍","hou2 dung3","very cold"]],
 sent:["我要凍嘅。","ngo5 jiu3 dung3 ge3","I'd like it iced."]},
{c:"熱",p:"jit6",m:"hot",comp:["火"],pos:["adj"],
 story:"The other half of the order. 熱奶茶 or 凍奶茶 — in Hong Kong you are always asked, and hesitating marks you out at once.",
 o:"Fire (灬, the flattened form of 火) under a figure kneeling over something. The four dots at the bottom of a character are almost always fire.",
 words:[["熱水","jit6 seoi2","hot water"],["熱茶","jit6 caa4","hot tea"],["好熱","hou2 jit6","very hot"]],
 sent:["今日好熱呀。","gam1 jat6 hou2 jit6 aa3","It's really hot today."]},
{c:"要",p:"jiu3",m:"to want; to need",comp:["女"],pos:["v","aux"],
 story:"How you order anything: 我要… . Negate it with 唔 and you have 唔要, 'no thanks'.",
 o:"A woman with her hands at her waist — the character originally drew the waist itself, a sense now written 腰.",
 words:[["唔要","m4 jiu3","don't want; no thanks"],["要唔要","jiu3 m4 jiu3","do you want…?"]],
 sent:["你要唔要飲嘢？","nei5 jiu3 m4 jiu3 jam2 je5","Would you like a drink?"]},
{c:"杯",p:"bui1",m:"cup; (measure for drinks)",comp:["木"],pos:["n","mw"],
 story:"Both the cup and the word for counting drinks: 一杯茶, 兩杯水.",
 o:"Wood (木) with 不 for the sound — cups were turned from wood long before they were fired from clay.",
 words:[["一杯","jat1 bui1","one cup of"],["杯茶","bui1 caa4","a cup of tea"]],
 sent:["兩杯咖啡，唔該。","loeng5 bui1 gaa3 fe1 m4 goi1","Two coffees, please."]},
{c:"碗",p:"wun2",m:"bowl; (measure for bowls)",comp:["石"],pos:["n","mw"],
 story:"What noodles and rice are counted in: 一碗麵, 兩碗飯.",
 o:"Stone (石) with 宛 for the sound. Bowls were ground from stone before they were thrown on a wheel.",
 words:[["一碗","jat1 wun2","one bowl of"],["碗飯","wun2 faan6","a bowl of rice"]],
 sent:["我食咗兩碗飯。","ngo5 sik6 zo2 loeng5 wun2 faan6","I ate two bowls of rice."]},
{c:"菜",p:"coi3",m:"vegetable; a dish",comp:["艸"],pos:["n"],
 story:"Both the greens and the dish. 點菜 dim2 coi3 is to order, and it is what you do with a menu in your hand.",
 o:"Grass (艹) over a hand picking from a tree — greens gathered by hand.",
 words:[["食菜","sik6 coi3","to eat vegetables"],["青菜","cing1 coi3","green vegetables"],["點菜","dim2 coi3","to order dishes"]],
 sent:["呢個菜好好食。","ni1 go3 coi3 hou2 hou2 sik6","This dish is delicious."]},
{c:"肉",p:"juk6",m:"meat",comp:[],pos:["n"],
 story:"juk6, with the hard k ending. As a component it squashes into ⺼, which is why 有 and 朋 look like they contain a moon and do not.",
 o:"A drawing of a slab of cut meat with the grain showing. Squeezed into a character it becomes ⺼, indistinguishable from 月 by sight alone.",
 words:[["食肉","sik6 juk6","to eat meat"],["牛肉","ngau4 juk6","beef"],["豬肉","zyu1 juk6","pork"]],
 sent:["我唔食肉。","ngo5 m4 sik6 juk6","I don't eat meat."]},
{c:"甜",p:"tim4",m:"sweet",comp:["甘","舌"],pos:["adj"],
 story:"少甜 siu2 tim4 — less sugar — is shouted at the kitchen of every cha chaan teng in Hong Kong a thousand times a day.",
 o:"Sweetness (甘) beside a tongue (舌). A taste drawn as the organ that tastes it.",
 words:[["少甜","siu2 tim4","less sugar"],["好甜","hou2 tim4","very sweet"],["甜品","tim4 ban2","dessert"]],
 sent:["呢個太甜喇。","ni1 go3 taai3 tim4 laa3","This is too sweet."]}
);

/* ---------- Stage 5 · 去邊度 — asking where something is, and getting on and off things to reach it ---------- */
HQ.push(
{c:"請",p:"cing2",m:"please; to invite",comp:["言"],pos:["v"],
 story:"More formal than 唔該 — it is the 'please' of signs and announcements rather than of ordering coffee.",
 o:"Speech (言) with 青 for the sound. Asking with words, politely.",
 words:[["請問","cing2 man6","may I ask"],["請坐","cing2 co5","please sit"]],
 sent:["請問，洗手間喺邊度？","cing2 man6 sai2 sau2 gaan1 hai2 bin1 dou6","Excuse me, where is the toilet?"]},
{c:"問",p:"man6",m:"to ask",comp:["門","口"],pos:["v"],
 story:"A mouth in a doorway. 請問 is how you open any question to a stranger.",
 o:"A mouth (口) inside a gate (門) — calling in at the door to ask. Its twin 聞 puts an ear there instead.",
 words:[["請問","cing2 man6","may I ask"],["問題","man6 tai4","question; problem"]],
 sent:["我想問你一個問題。","ngo5 soeng2 man6 nei5 jat1 go3 man6 tai4","I'd like to ask you something."]},
{c:"喺",p:"hai2",m:"at; in; to be located",comp:["口","係"],pos:["cov","v"],
 story:"Do not confuse it with 係 hai6. 喺 hai2 is 'at'; 係 hai6 is 'is'. One tone apart, and they do completely different jobs.",
 o:"A mouth (口) beside 係 for the sound — another Cantonese-only character built the usual way. Mandarin uses 在 for this.",
 words:[["喺度","hai2 dou6","here; present"],["喺邊度","hai2 bin1 dou6","where"],["住喺","zyu6 hai2","to live at"]],
 sent:["我喺屋企。","ngo5 hai2 uk1 kei2","I'm at home."]},
{c:"去",p:"heoi3",m:"to go",comp:["土"],pos:["v"],
 story:"heoi3 — and its opposite 嚟 lai4, to come. Cantonese puts them together constantly: 去嚟 is 'back and forth'.",
 o:"A person stepping away from an enclosure. Leaving, drawn as a figure already past the door.",
 words:[["去邊度","heoi3 bin1 dou6","where are you going"],["去街","heoi3 gaai1","to go out"],["去食飯","heoi3 sik6 faan6","to go and eat"]],
 sent:["你去邊度呀？","nei5 heoi3 bin1 dou6 aa3","Where are you going?"]},
{c:"嚟",p:"lai4",m:"to come",comp:["口","黎"],pos:["v"],
 story:"Mandarin's 來 lái is 嚟 lai4 in written Cantonese — a different character for the same word, built the Cantonese way.",
 o:"A mouth (口) with 黎 for the sound. Cantonese wrote itself a new character rather than borrow 來, which it reserves for formal writing.",
 words:[["過嚟","gwo3 lai4","come over"],["返嚟","faan1 lai4","to come back"],["嚟食飯","lai4 sik6 faan6","come and eat"]],
 sent:["你幾時嚟呀？","nei5 gei2 si4 lai4 aa3","When are you coming?"]},
{c:"邊",p:"bin1",m:"which; where; side",comp:["辶"],pos:["part-q"],
 story:"The question word that starts most questions: 邊度 where, 邊個 who, 邊樣 which one.",
 o:"The walking radical (辶) with 臱 for the sound. From 'edge' came 'which side', and from that came 'which'.",
 words:[["邊度","bin1 dou6","where"],["邊個","bin1 go3","who"],["喺邊度","hai2 bin1 dou6","where"]],
 sent:["洗手間喺邊度？","sai2 sau2 gaan1 hai2 bin1 dou6","Where's the toilet?"]},
{c:"度",p:"dou6",m:"place; degree",comp:["广"],pos:["n"],
 story:"Inside 邊度 (where) and 呢度 (here). On its own it is a degree — of temperature, or of anything measured.",
 o:"A hand measuring under a shelter (广). Measuring a place, then the place itself.",
 words:[["呢度","ni1 dou6","here"],["嗰度","go2 dou6","there"],["邊度","bin1 dou6","where"]],
 sent:["我喺呢度等你。","ngo5 hai2 ni1 dou6 dang2 nei5","I'll wait for you here."]},
{c:"呢",p:"ni1",m:"this",comp:["口","尼"],pos:["pron"],
 story:"Dictionaries list it as nei4 or ne1, but the demonstrative everyone says is ni1 — 呢個, 呢度, 呢啲.",
 o:"A mouth (口) with 尼 for the sound. In Mandarin the same character is a question particle; in Cantonese it is 'this'.",
 words:[["呢個","ni1 go3","this one"],["呢度","ni1 dou6","here"],["呢啲","ni1 di1","these"]],
 sent:["呢個幾多錢呀？","ni1 go3 gei2 do1 cin2 aa3","How much is this one?"]},
{c:"嗰",p:"go2",m:"that",comp:["口","個"],pos:["pron"],
 story:"The partner of 呢. This one here, that one over there — 呢個 and 嗰個.",
 o:"A mouth (口) with 個 for the sound. Cantonese-only, and built exactly the way 呢 and 哋 were.",
 words:[["嗰個","go2 go3","that one"],["嗰度","go2 dou6","there"],["嗰啲","go2 di1","those"]],
 sent:["我要嗰個。","ngo5 jiu3 go2 go3","I'd like that one."]},
{c:"屋",p:"uk1",m:"house",comp:["尸"],pos:["n"],
 story:"屋企 uk1 kei2 is home — and note 企 is read kei2 here, not kei5. Cantonese words do this; the character alone won't tell you.",
 o:"A body (尸) under a roof, over 至, to arrive. The place you come to and lie down.",
 words:[["屋企","uk1 kei2","home"],["屋企人","uk1 kei2 jan4","family"]],
 sent:["我返屋企喇。","ngo5 faan1 uk1 kei2 laa3","I'm going home."]},
{c:"企",p:"kei5",m:"to stand",comp:["人","止"],pos:["v"],
 story:"On its own, kei5, to stand. Inside 屋企 it softens to kei2 and means home — the same character, a different word.",
 o:"A person (人) over a foot (止) — someone standing still on their own two feet.",
 words:[["企喺度","kei5 hai2 dou6","to stand there"],["屋企","uk1 kei2","home"]],
 sent:["唔好企喺門口。","m4 hou2 kei5 hai2 mun4 hau2","Don't stand in the doorway."]},
{c:"街",p:"gaai1",m:"street",comp:["行","土"],pos:["n"],
 story:"出街 and 去街 both mean going out — Hong Kong life happens on the street, and the language follows.",
 o:"Two mounds of earth (圭) inside 行, a crossroads. The character is a picture of a junction seen from above.",
 words:[["去街","heoi3 gaai1","to go out"],["出街","ceot1 gaai1","to go out"],["街市","gaai1 si5","wet market"]],
 sent:["我哋出街啦。","ngo5 dei6 ceot1 gaai1 laa1","Let's go out."]},
{c:"車",p:"ce1",m:"vehicle; car",comp:[],pos:["n"],
 story:"Everything on wheels: 火車 train, 巴士 bus takes a loanword instead, 電車 the Hong Kong tram.",
 o:"A cart seen from above — two wheels on an axle, with the body between them. Turn the character on its side to see it.",
 words:[["車站","ce1 zaam6","bus stop; station"],["坐車","co5 ce1","to ride"],["電車","din6 ce1","tram"]],
 sent:["我哋坐車去。","ngo5 dei6 co5 ce1 heoi3","We'll take transport there."]},
{c:"站",p:"zaam6",m:"station; to stand",comp:["立"],pos:["n"],
 story:"Every MTR announcement in Hong Kong ends with it: 下一站 — next station.",
 o:"To stand (立) with 占 for the sound. A stopping place, named for standing about in it.",
 words:[["車站","ce1 zaam6","bus stop; station"],["下一站","haa6 jat1 zaam6","next station"]],
 sent:["下一站係中環。","haa6 jat1 zaam6 hai6 zung1 waan4","The next station is Central."]},
{c:"上",p:"soeng6",m:"up; above; to board",comp:["一"],pos:["loc","v"],
 story:"Position and movement at once: 上面 above, 上車 to get on a vehicle, 上班 to go to work.",
 o:"A mark sitting on top of a baseline. Meaning shown by position rather than by a picture.",
 words:[["上面","soeng6 min6","above; on top"],["上車","soeng5 ce1","to get on"],["早上","zou2 soeng6","morning"]],
 sent:["書喺枱上面。","syu1 hai2 toi2 soeng6 min6","The book is on the table."]},
{c:"落",p:"lok6",m:"down; to get off",comp:["艸","水"],pos:["v","loc"],
 story:"Where Mandarin says 下車, Cantonese says 落車. And 落雨 is how Cantonese says it's raining.",
 o:"Grass (艹) over water (氵) and 各 — leaves coming down. Falling, then descending generally.",
 words:[["落車","lok6 ce1","to get off"],["落雨","lok6 jyu5","to rain"],["落嚟","lok6 lai4","come down"]],
 sent:["落雨喇，快啲返屋企。","lok6 jyu5 laa3 faai3 di1 faan1 uk1 kei2","It's raining — hurry home."]},
{c:"入",p:"jap6",m:"to enter",comp:[],pos:["v"],
 story:"入 and 出 are a pair you will see on every door in Hong Kong.",
 o:"An arrowhead pointing in, or the mouth of a cave. Careful: it is not 人 — the strokes cross at the top.",
 words:[["入嚟","jap6 lai4","come in"],["入去","jap6 heoi3","go in"],["入面","jap6 min6","inside"]],
 sent:["請入嚟坐。","cing2 jap6 lai4 co5","Please come in and sit."]},
{c:"出",p:"ceot1",m:"to go out; to exit",comp:[],pos:["v"],
 story:"出面 is outside, 出街 is going out, 出口 is the exit sign above every door.",
 o:"A foot stepping out of an enclosure, drawn twice over. Leaving, emphasised by repetition.",
 words:[["出街","ceot1 gaai1","to go out"],["出面","ceot1 min6","outside"],["出口","ceot1 hau2","exit"]],
 sent:["出口喺嗰度。","ceot1 hau2 hai2 go2 dou6","The exit is over there."]}
);

/* ---------- Stage 6 · 幾點 — clock and calendar, including the words for morning and lunch that mandarin doesn't have ---------- */
HQ.push(
{c:"今",p:"gam1",m:"now; this (day)",comp:["人"],pos:["n"],
 story:"今日 today, 今晚 tonight. Cantonese says gam1 jat6 where Mandarin says jīn tiān — and uses 日 for 'day' where Mandarin prefers 天.",
 o:"A roof over a gathering mark: the moment under this roof. Now, drawn as the present place.",
 words:[["今日","gam1 jat6","today"],["今晚","gam1 maan5","tonight"],["今朝","gam1 ziu1","this morning"]],
 sent:["今日星期幾呀？","gam1 jat6 sing1 kei4 gei2 aa3","What day is it today?"]},
{c:"日",p:"jat6",m:"sun; day",comp:[],pos:["n"],
 story:"Cantonese counts days with 日 where Mandarin uses 天: 今日, 聽日, 兩日.",
 o:"A circle with a dot at the centre — the sun. Brush writing squared off the circle and flattened the dot into a line.",
 words:[["今日","gam1 jat6","today"],["聽日","ting1 jat6","tomorrow"],["生日","saang1 jat6","birthday"]],
 sent:["聽日我唔返工。","ting1 jat6 ngo5 m4 faan1 gung1","I'm not working tomorrow."]},
{c:"聽",p:"teng1",m:"to listen; to hear",comp:["耳"],pos:["v"],
 story:"Two readings doing two jobs. teng1 is to listen; ting1 is the one inside 聽日, tomorrow. Same character, and you need both.",
 o:"An ear (耳) with 王 and a straight heart (直 over 心) — listening drawn as an ear and an honest mind together.",
 words:[["聽日","ting1 jat6","tomorrow"],["聽日見","ting1 jat6 gin3","see you tomorrow"],["聽歌","teng1 go1","to listen to music"]],
 sent:["我聽唔明。","ngo5 teng1 m4 ming4","I don't understand (what I'm hearing)."]},
{c:"朝",p:"ziu1",m:"morning",comp:["月"],pos:["n"],
 story:"今朝 this morning, 朝早 the early morning. Cantonese keeps 朝 where Mandarin has largely moved to 早上.",
 o:"The sun rising through grass with the moon still up — dawn, with both in the sky at once.",
 words:[["今朝","gam1 ziu1","this morning"],["朝早","ziu1 zou2","morning"],["聽朝","ting1 ziu1","tomorrow morning"]],
 sent:["朝早八點返工。","ziu1 zou2 baat3 dim2 faan1 gung1","Work starts at eight in the morning."]},
{c:"晏",p:"aan3",m:"midday; late morning",comp:["日","安"],pos:["n"],
 story:"晏晝 aan3 zau3 is the afternoon, and 食晏 is lunch. Neither word exists in Mandarin — this is Cantonese keeping its own vocabulary.",
 o:"The sun (日) over 安, peaceful — the settled part of the day when the sun is at its height.",
 words:[["食晏","sik6 aan3","to have lunch"],["晏晝","aan3 zau3","afternoon"]],
 sent:["我哋一齊食晏啦。","ngo5 dei6 jat1 cai4 sik6 aan3 laa1","Let's have lunch together."]},
{c:"夜",p:"je6",m:"night",comp:["夕"],pos:["n"],
 story:"夜晚 is the night, 宵夜 siu1 je2 is the late-night meal Hong Kong is built around.",
 o:"A person under the evening (夕) with a mark for the moon. Night drawn as someone out under it.",
 words:[["夜晚","je6 maan5","night; at night"],["夜市","je6 si5","night market"],["宵夜","siu1 je2","late-night snack"]],
 sent:["夜晚好凍呀。","je6 maan5 hou2 dung3 aa3","It's very cold at night."]},
{c:"點",p:"dim2",m:"o'clock; dot; how",comp:["火"],pos:["n","part-q"],
 story:"Works hard. 幾點 is what time, 點心 is dim sum, and 點呀 on its own means 'how's it going?'.",
 o:"Fire (灬) under 占 — a spot burned onto something. From a dot came a point on a clock face.",
 words:[["幾點","gei2 dim2","what time"],["點心","dim2 sam1","dim sum"],["點樣","dim2 joeng2","how"]],
 sent:["而家幾點呀？","ji4 gaa1 gei2 dim2 aa3","What time is it now?"]},
{c:"分",p:"fan1",m:"minute; to divide",comp:["八","刀"],pos:["n","v"],
 story:"Minutes on a clock, and cents in your pocket. 十分 is both 'ten minutes' and 'extremely'.",
 o:"A knife (刀) under 八, the splitting mark. Division drawn as a blade separating two halves.",
 words:[["十分","sap6 fan1","ten minutes; extremely"],["分鐘","fan1 zung1","minute"]],
 sent:["等我五分鐘。","dang2 ngo5 ng5 fan1 zung1","Give me five minutes."]},
{c:"鐘",p:"zung1",m:"clock; o'clock",comp:["金"],pos:["n"],
 story:"點鐘 for the hour, 分鐘 for the minute. A bell became a clock in every language that had bells first.",
 o:"Metal (金) with 童 for the sound. It was a bell long before it was a clock.",
 words:[["分鐘","fan1 zung1","minute"],["點鐘","dim2 zung1","o'clock"],["鐘頭","zung1 tau4","hour"]],
 sent:["等咗一個鐘頭。","dang2 zo2 jat1 go3 zung1 tau4","I waited an hour."]},
{c:"星",p:"sing1",m:"star",comp:["日","生"],pos:["n"],
 story:"星期 is the week — literally a 'star period', from the seven-day cycle named after the planets.",
 o:"The sun (日) over 生, to grow: lights that come up in the sky. The top was three suns before it was simplified to one.",
 words:[["星期","sing1 kei4","week"],["星期日","sing1 kei4 jat6","Sunday"],["星期一","sing1 kei4 jat1","Monday"]],
 sent:["星期六你得唔得閒？","sing1 kei4 luk6 nei5 dak1 m4 dak1 haan4","Are you free on Saturday?"]},
{c:"期",p:"kei4",m:"period; a set time",comp:["月"],pos:["n"],
 story:"Days of the week are pure arithmetic: 星期一 Monday through 星期六 Saturday, then 星期日 for Sunday.",
 o:"The moon (月) with 其 for the sound. Time measured in moons, before it was measured in anything else.",
 words:[["星期","sing1 kei4","week"],["下星期","haa6 sing1 kei4","next week"],["日期","jat6 kei4","date"]],
 sent:["下星期見。","haa6 sing1 kei4 gin3","See you next week."]},
{c:"月",p:"jyut6",m:"moon; month",comp:[],pos:["n"],
 story:"jyut6 — and 粵 jyut6, the character for Cantonese itself, is a homophone. Months are moons in most languages.",
 o:"A crescent, drawn curved because the moon is rarely full. The 月 inside 有 and 朋 is really 肉, flesh — a different part that collapsed into the same shape.",
 words:[["一月","jat1 jyut6","January"],["月頭","jyut6 tau4","start of the month"],["個月","go3 jyut6","a month"]],
 sent:["下個月我去旅行。","haa6 go3 jyut6 ngo5 heoi3 leoi5 hang4","I'm travelling next month."]},
{c:"年",p:"nin4",m:"year",comp:[],pos:["n"],
 story:"今年 this year, 出年 next year — Cantonese says 出年 where Mandarin says 明年.",
 o:"A person carrying a harvested crop. A year was one harvest, which is how most languages first counted them.",
 words:[["今年","gam1 nin4","this year"],["出年","ceot1 nin2","next year"],["新年","san1 nin4","New Year"]],
 sent:["新年快樂！","san1 nin4 faai3 lok6","Happy New Year!"]}
);

/* ---------- Stage 7 · 屋企人 — the people around you, and the prefix 老 that isn't about age ---------- */
HQ.push(
{c:"爸",p:"baa1",m:"dad",comp:["父"],pos:["n"],
 story:"爸爸 baa4 baa1, and in Hong Kong 老豆 lou5 dau6 is just as common — an affectionate 'old bean' for your father.",
 o:"Father (父) with 巴 for the sound. The 父 on top is a hand holding a stick — authority, drawn bluntly.",
 words:[["爸爸","baa4 baa1","dad"],["老爸","lou5 baa1","my old man"]],
 sent:["我爸爸係老師。","ngo5 baa4 baa1 hai6 lou5 si1","My dad is a teacher."]},
{c:"媽",p:"maa1",m:"mum",comp:["女","馬"],pos:["n"],
 story:"媽媽 maa4 maa1. Watch the tones — 媽 maa1, 麻 maa4, 馬 maa5 and 罵 maa6 are four different words built on one syllable.",
 o:"Woman (女) with horse (馬) for the sound. The horse is doing no work here except telling you how to say it.",
 words:[["媽媽","maa4 maa1","mum"],["阿媽","aa3 maa1","mum"]],
 sent:["我阿媽煮飯好好食。","ngo5 aa3 maa1 zyu2 faan6 hou2 hou2 sik6","My mum's cooking is delicious."]},
{c:"哥",p:"go1",m:"older brother",comp:["口"],pos:["n"],
 story:"哥哥 for an older brother, and 大佬 daai6 lou2 in everyday Hong Kong speech — which also works as 'mate' shouted across a room.",
 o:"Two 可 stacked. The doubling was originally a singing sound, borrowed for the family word.",
 words:[["哥哥","go4 go1","older brother"],["表哥","biu2 go1","older male cousin"]],
 sent:["我哥哥大我兩年。","ngo5 go4 go1 daai6 ngo5 loeng5 nin4","My brother is two years older than me."]},
{c:"姐",p:"ze2",m:"older sister",comp:["女","且"],pos:["n"],
 story:"家姐 gaa1 ze1 is the everyday Cantonese for an older sister — 姐姐 sounds slightly bookish by comparison.",
 o:"Woman (女) with 且 for the sound.",
 words:[["家姐","gaa1 ze1","older sister"],["姐姐","ze4 ze2","older sister"]],
 sent:["我家姐住喺英國。","ngo5 gaa1 ze1 zyu6 hai2 jing1 gwok3","My sister lives in Britain."]},
{c:"弟",p:"dai6",m:"younger brother",comp:[],pos:["n"],
 story:"細佬 sai3 lou2 is what you will actually hear — literally 'small fellow'. 弟弟 is the written word.",
 o:"A cord wound in order round a stake — the sequence of siblings, drawn as a sequence.",
 words:[["弟弟","dai4 dai2","younger brother"],["兄弟","hing1 dai6","brothers"]],
 sent:["我有一個弟弟。","ngo5 jau5 jat1 go3 dai4 dai2","I have a younger brother."]},
{c:"妹",p:"mui6",m:"younger sister",comp:["女","未"],pos:["n"],
 story:"細妹 sai3 mui2 for a younger sister, matching 細佬 for a younger brother.",
 o:"Woman (女) with 未, not yet, for the sound — and, conveniently, for the sense of the one who came later.",
 words:[["細妹","sai3 mui2","younger sister"],["妹妹","mui4 mui2","younger sister"]],
 sent:["我細妹讀緊書。","ngo5 sai3 mui2 duk6 gan2 syu1","My younger sister is studying."]},
{c:"公",p:"gung1",m:"grandfather; public",comp:["八"],pos:["n","adj"],
 story:"阿公 for a grandfather, but also 公司 company and 公園 park — the same character does family and 'public'.",
 o:"The splitting mark (八) over a private enclosure: dividing what was held back. Sharing, and from that, the public.",
 words:[["公司","gung1 si1","company"],["公園","gung1 jyun2","park"],["老公","lou5 gung1","husband"]],
 sent:["我返公司開會。","ngo5 faan1 gung1 si1 hoi1 wui2","I'm going to the office for a meeting."]},
{c:"婆",p:"po4",m:"grandmother; old woman",comp:["女","波"],pos:["n"],
 story:"老婆 lou5 po4 is your wife, not an old woman — and 阿婆 is a grandmother. Context does all the work.",
 o:"Woman (女) under 波, a wave, for the sound.",
 words:[["老婆","lou5 po4","wife"],["阿婆","aa3 po4","old lady; grandma"],["婆婆","po4 po2","grandmother"]],
 sent:["佢老婆好靚。","keoi5 lou5 po4 hou2 leng3","His wife is beautiful."]},
{c:"老",p:"lou5",m:"old",comp:[],pos:["adj"],
 story:"A prefix as much as a word. 老公 husband, 老婆 wife, 老師 teacher, 老細 boss — none of them are about age.",
 o:"A bent figure with long hair leaning on a stick. One of the clearest pictographs still in daily use.",
 words:[["老師","lou5 si1","teacher"],["老細","lou5 sai3","boss"],["老友","lou5 jau5","old friend; mate"]],
 sent:["我老細好好人。","ngo5 lou5 sai3 hou2 hou2 jan4","My boss is a good person."]},
{c:"朋",p:"pang4",m:"friend",comp:["月"],pos:["n"],
 story:"Only really lives in 朋友 — you will rarely meet it alone.",
 o:"Two strings of cowrie shells hung side by side. Friendship drawn as matched value, not as two moons.",
 words:[["朋友","pang4 jau5","friend"],["男朋友","naam4 pang4 jau5","boyfriend"],["女朋友","neoi5 pang4 jau5","girlfriend"]],
 sent:["佢係我嘅好朋友。","keoi5 hai6 ngo5 ge3 hou2 pang4 jau5","She's a good friend of mine."]},
{c:"友",p:"jau5",m:"friend",comp:[],pos:["n"],
 story:"Same sound as 有 jau5, so 朋友 and 有 will keep tangling in your ear until the tones settle.",
 o:"Two right hands drawn one over the other — two people reaching the same way. Friendship as a handshake.",
 words:[["朋友","pang4 jau5","friend"],["老友","lou5 jau5","old friend; mate"]],
 sent:["我同朋友去食飯。","ngo5 tung4 pang4 jau5 heoi3 sik6 faan6","I'm going to eat with a friend."]}
);

/* ---------- Stage 8 · 做乜嘢 — the verbs a day is made of — and the ones cantonese keeps where mandarin moved on ---------- */
HQ.push(
{c:"做",p:"zou6",m:"to do; to make",comp:["人","故"],pos:["v"],
 story:"做乜嘢 and 做咩 both mean 'what are you doing' — and 做嘢 is to work.",
 o:"A person (亻) with 故 for the sound. A late character, built for the plain everyday verb.",
 words:[["做嘢","zou6 je5","to work"],["做乜","zou6 mat1","why; what for"],["做咩","zou6 me1","why; what for"]],
 sent:["你做緊乜嘢呀？","nei5 zou6 gan2 mat1 je5 aa3","What are you doing?"]},
{c:"乜",p:"mat1",m:"what",comp:[],pos:["part-q"],
 story:"乜嘢 mat1 je5 is 'what'. Cantonese has no 什麼 in speech — this is the word.",
 o:"A two-stroke character borrowed purely for its sound. In Mandarin it is a rare surname; in Cantonese it is a word you use hourly.",
 words:[["乜嘢","mat1 je5","what"],["做乜","zou6 mat1","why; what for"],["乜都得","mat1 dou1 dak1","anything's fine"]],
 sent:["你講乜嘢呀？","nei5 gong2 mat1 je5 aa3","What are you saying?"]},
{c:"嘢",p:"je5",m:"thing; stuff",comp:["口","野"],pos:["n"],
 story:"The all-purpose noun. 食嘢 eat something, 飲嘢 have a drink, 買嘢 do some shopping, 好多嘢做 lots to do.",
 o:"A mouth (口) with 野 for the sound. Cantonese-only, and one of the most used characters in the written language.",
 words:[["食嘢","sik6 je5","to eat something"],["飲嘢","jam2 je5","to have a drink"],["買嘢","maai5 je5","to shop"]],
 sent:["我要買啲嘢。","ngo5 jiu3 maai5 di1 je5","I need to buy some things."]},
{c:"睇",p:"tai2",m:"to look; to watch; to read",comp:["目","弟"],pos:["v"],
 story:"Cantonese says 睇 where Mandarin says 看. 睇戲 watch a film, 睇書 read a book, 睇醫生 see a doctor.",
 o:"An eye (目) with 弟 for the sound. Mandarin has the character but almost never uses it; in Cantonese it is the ordinary verb.",
 words:[["睇嘢","tai2 je5","to watch something"],["好睇","hou2 tai2","good to watch; good-looking"],["睇戲","tai2 hei3","to watch a film"]],
 sent:["我哋去睇戲啦。","ngo5 dei6 heoi3 tai2 hei3 laa1","Let's go and see a film."]},
{c:"講",p:"gong2",m:"to speak; to say",comp:["言"],pos:["v"],
 story:"講廣東話 — to speak Cantonese. Where Mandarin reaches for 說, Cantonese uses 講.",
 o:"Speech (言) with 冓 for the sound. The speech radical marks it as something done aloud.",
 words:[["講嘢","gong2 je5","to talk"],["講笑","gong2 siu3","to joke"],["再講","zoi3 gong2","talk again; and also"]],
 sent:["你識唔識講廣東話？","nei5 sik1 m4 sik1 gong2 gwong2 dung1 waa2","Do you speak Cantonese?"]},
{c:"話",p:"waa6",m:"words; language; to say",comp:["言"],pos:["n","v"],
 story:"廣東話 is Cantonese itself — and note the tone shifts to waa2 in that word, which happens constantly in Cantonese compounds.",
 o:"Speech (言) with 舌, tongue, for the sound. Words drawn as the tongue that makes them.",
 words:[["廣東話","gwong2 dung1 waa2","Cantonese"],["電話","din6 waa2","telephone"],["聽話","teng1 waa6","to be obedient"]],
 sent:["我學緊廣東話。","ngo5 hok6 gan2 gwong2 dung1 waa2","I'm learning Cantonese."]},
{c:"買",p:"maai5",m:"to buy",comp:["貝"],pos:["v"],
 story:"買 maai5 and 賣 maai6 differ only in tone, and they are opposites. This is the pair that convinces people Cantonese tones matter.",
 o:"A net over a cowrie shell (貝) — money caught. Shells were currency, which is why 貝 sits inside everything to do with money.",
 words:[["買嘢","maai5 je5","to shop"],["買飛","maai5 fei1","to buy a ticket"]],
 sent:["我想買呢個。","ngo5 soeng2 maai5 ni1 go3","I'd like to buy this one."]},
{c:"賣",p:"maai6",m:"to sell",comp:["貝"],pos:["v"],
 story:"買 is to buy, 賣 is to sell, and the only difference in speech is tone 5 against tone 6. Get it wrong in a shop and you will be corrected.",
 o:"A shell (貝) under 罒 and 士. It began as 買 with 出 on top — buying, outwards — but the top half wore down into something else entirely, and the money at the bottom is what survived.",
 words:[["賣嘢","maai6 je5","to sell things"],["賣飛","maai6 fei1","to sell tickets"]],
 sent:["呢度賣唔賣水？","ni1 dou6 maai6 m4 maai6 seoi2","Do you sell water here?"]},
{c:"行",p:"haang4",m:"to walk",comp:[],pos:["v"],
 story:"Two readings, two words. haang4 is to walk — 行街 is going out shopping. hang4 is the formal 'to conduct' you meet in writing.",
 o:"A crossroads seen from above — four ways meeting. Every character about roads and movement has this shape somewhere in it.",
 words:[["行街","haang4 gaai1","to go shopping"],["行路","haang4 lou6","to walk"],["行得","haang4 dak1","walkable; that'll do"]],
 sent:["我哋行路去啦。","ngo5 dei6 haang4 lou6 heoi3 laa1","Let's walk there."]},
{c:"坐",p:"co5",m:"to sit",comp:["土","人"],pos:["v"],
 story:"co5, not the zo6 that dictionaries list — that is the literary reading, and nobody uses it for sitting down.",
 o:"Two people (人) sitting on the earth (土) facing each other. A picture of exactly what it means.",
 words:[["坐低","co5 dai1","to sit down"],["請坐","cing2 co5","please sit"],["坐車","co5 ce1","to ride"]],
 sent:["請坐低啦。","cing2 co5 dai1 laa1","Please have a seat."]},
{c:"瞓",p:"fan3",m:"to sleep",comp:["目"],pos:["v"],
 story:"瞓覺 fan3 gaau3 is to sleep. Mandarin has no such word — this character was made in Cantonese for a Cantonese verb.",
 o:"An eye (目) with 訓 for the sound. An eye, closed.",
 words:[["早瞓","zou2 fan3","to sleep early; an early night"],["瞓覺","fan3 gaau3","to sleep"],["瞓唔着","fan3 m4 zoek6","can't get to sleep"]],
 sent:["我想去瞓覺。","ngo5 soeng2 heoi3 fan3 gaau3","I want to go to sleep."]},
{c:"返",p:"faan1",m:"to return; to go (to work)",comp:["辶"],pos:["v"],
 story:"Not the faan2 dictionaries list. faan1 is the everyday word: 返屋企 go home, 返工 go to work, 返嚟 come back.",
 o:"The walking radical (辶) with 反, to turn over. Going back the way you came.",
 words:[["返工","faan1 gung1","to go to work"],["返屋企","faan1 uk1 kei2","to go home"],["返嚟","faan1 lai4","to come back"]],
 sent:["我聽日返工。","ngo5 ting1 jat6 faan1 gung1","I'm working tomorrow."]},
{c:"工",p:"gung1",m:"work",comp:[],pos:["n"],
 story:"返工 is going to work and 收工 is knocking off — both phrases you will hear every weekday in Hong Kong.",
 o:"A carpenter's square, the tool for making a true right angle. Work drawn as the instrument of it.",
 words:[["返工","faan1 gung1","to go to work"],["收工","sau1 gung1","to finish work"],["打工","daa2 gung1","to work a job"]],
 sent:["我五點收工。","ngo5 ng5 dim2 sau1 gung1","I finish work at five."]},
{c:"學",p:"hok6",m:"to learn; to study",comp:["子"],pos:["v"],
 story:"學廣東話 — and note the k at the end of hok6, stopped dead. Mandarin lost those endings; Cantonese kept every one.",
 o:"Two hands over a child (子) under a roof, with a lattice between — an adult guiding a child's hands. Teaching, drawn literally.",
 words:[["學生","hok6 saang1","student"],["學校","hok6 haau6","school"],["學嘢","hok6 je5","to learn"]],
 sent:["我學緊廣東話。","ngo5 hok6 gan2 gwong2 dung1 waa2","I'm learning Cantonese."]},
{c:"識",p:"sik1",m:"to know how; to be acquainted with",comp:["言"],pos:["v"],
 story:"識講 is 'can speak', 識佢 is 'know him'. Cantonese uses 識 for both knowing a person and knowing how.",
 o:"Speech (言) with 戠 for the sound. Knowledge drawn as something spoken.",
 words:[["識講","sik1 gong2","can speak"],["唔識","m4 sik1","don't know how"],["識人","sik1 jan4","to know people"]],
 sent:["我唔識寫呢個字。","ngo5 m4 sik1 se2 ni1 go3 zi6","I don't know how to write this character."]},
{c:"寫",p:"se2",m:"to write",comp:[],pos:["v"],
 story:"寫字 is to write. Written Cantonese is its own skill — most formal writing in Hong Kong is Standard Chinese, not what you speak.",
 o:"A roof over 舄, a magpie. Originally 'to set down under a roof', which became copying, and then writing.",
 words:[["寫嘢","se2 je5","to write something"],["寫字","se2 zi6","to write"],["寫低","se2 dai1","to write down"]],
 sent:["唔該幫我寫低。","m4 goi1 bong1 ngo5 se2 dai1","Please write it down for me."]}
);

/* ---------- Stage 9 · 點形容 — big, small, cheap, tired — and the tone pairs that mean opposite things ---------- */
HQ.push(
{c:"大",p:"daai6",m:"big",comp:["人","一"],pos:["adj"],
 story:"Remember 好 in front of an adjective means 'very': 好大 is very big.",
 o:"A person (人) with arms stretched wide. Size shown by a human gesture rather than by a big thing.",
 words:[["好大","hou2 daai6","very big"],["大人","daai6 jan4","adult"],["大佬","daai6 lou2","older brother; mate"]],
 sent:["間屋好大呀。","gaan1 uk1 hou2 daai6 aa3","The flat is very big."]},
{c:"細",p:"sai3",m:"small",comp:["糸"],pos:["adj"],
 story:"Cantonese says 細 where Mandarin says 小 — 細佬 little brother, 細路 a child, 老細 the boss.",
 o:"Silk (糸) with 田 for the sound. Fine threads, then fineness, then smallness.",
 words:[["細佬","sai3 lou2","younger brother"],["細路","sai3 lou6","child"],["好細","hou2 sai3","very small"]],
 sent:["呢件衫太細喇。","ni1 gin6 saam1 taai3 sai3 laa3","This shirt is too small."]},
{c:"靚",p:"leng3",m:"pretty; good-looking; nice",comp:["見"],pos:["adj"],
 story:"Pure Cantonese, and used constantly — a person, a dress, a plate of food can all be 靚.",
 o:"To see (見) with 青 for the sound. Something worth looking at.",
 words:[["好靚","hou2 leng3","very pretty"],["靚仔","leng3 zai2","handsome boy"],["靚女","leng3 neoi2","pretty girl"]],
 sent:["你件衫好靚。","nei5 gin6 saam1 hou2 leng3","Your shirt is lovely."]},
{c:"平",p:"peng4",m:"cheap",comp:[],pos:["adj"],
 story:"peng4 means cheap; the same character read ping4 means level or peaceful. Two words, one shape — and the market one is peng4.",
 o:"A balance beam hanging level. From 'level' came 'fair', and from a fair price came 'cheap'.",
 words:[["好平","hou2 peng4","very cheap"],["平啲","peng4 di1","a bit cheaper"],["平安","ping4 on1","safe and sound"]],
 sent:["可唔可以平啲呀？","ho2 m4 ho2 ji5 peng4 di1 aa3","Could you make it a bit cheaper?"]},
{c:"貴",p:"gwai3",m:"expensive",comp:["貝"],pos:["adj"],
 story:"The 貝 at the bottom is a cowrie shell — money. Every expensive character has it somewhere.",
 o:"Hands lifting something above a shell (貝). Value drawn as something held up and paid for.",
 words:[["好貴","hou2 gwai3","very expensive"],["太貴","taai3 gwai3","too expensive"]],
 sent:["太貴喇，唔要。","taai3 gwai3 laa3 m4 jiu3","Too expensive — no thanks."]},
{c:"快",p:"faai3",m:"fast; quick",comp:["心"],pos:["adj"],
 story:"快啲 faai3 di1 — 'hurry up' — is one of the most-heard phrases in Hong Kong.",
 o:"The heart radical (忄) with 夬 for the sound. Speed felt rather than seen.",
 words:[["快啲","faai3 di1","hurry up"],["好快","hou2 faai3","very fast"],["快樂","faai3 lok6","happy"]],
 sent:["快啲啦，遲到喇！","faai3 di1 laa1 ci4 dou3 laa3","Hurry up, we're late!"]},
{c:"慢",p:"maan6",m:"slow",comp:["心"],pos:["adj"],
 story:"慢慢 maan6 maan2 means 'take your time' — and 慢慢食 is what a waiter says as they set your food down.",
 o:"The heart radical (忄) with 曼 for the sound. Like 快, an inward feeling rather than a measured speed.",
 words:[["慢慢","maan6 maan2","slowly; take your time"],["好慢","hou2 maan6","very slow"]],
 sent:["唔好急，慢慢講。","m4 hou2 gap1 maan6 maan2 gong2","Don't rush — speak slowly."]},
{c:"新",p:"san1",m:"new",comp:["斤"],pos:["adj"],
 story:"新年 New Year, 新嘅 the new one. Its opposite 舊 is what you will hear in every second-hand shop.",
 o:"An axe (斤) beside 亲 for the sound. It once drew a hazel tree being cut; the tree is no longer visible in the modern glyph, but the axe is, and so is the idea — newness as the fresh cut.",
 words:[["新年","san1 nin4","New Year"],["新嘅","san1 ge3","the new one"],["最新","zeoi3 san1","the newest"]],
 sent:["呢個係新嘅。","ni1 go3 hai6 san1 ge3","This one is new."]},
{c:"舊",p:"gau6",m:"old (of things)",comp:["臼"],pos:["adj"],
 story:"For things, not people — an old person is 老, an old phone is 舊. Mixing them up is a common slip.",
 o:"A bird over a mortar (臼), borrowed for its sound. The original owl has nothing to do with the meaning.",
 words:[["舊嘢","gau6 je5","old things"],["好舊","hou2 gau6","very old"]],
 sent:["我部電話好舊。","ngo5 bou6 din6 waa2 hou2 gau6","My phone is very old."]},
{c:"高",p:"gou1",m:"tall; high",comp:[],pos:["adj"],
 story:"高 for height, and 高興 for pleased — being happy is being high in most languages.",
 o:"A watchtower drawn in elevation: roof, upper storey, door below. One of the clearest surviving pictographs.",
 words:[["好高","hou2 gou1","very tall"],["高興","gou1 hing3","pleased"]],
 sent:["佢好高。","keoi5 hou2 gou1","He's very tall."]},
{c:"長",p:"coeng4",m:"long",comp:[],pos:["adj"],
 story:"coeng4 is long; the same character read zoeng2 means to grow, or a boss. Two words again, told apart only by tone.",
 o:"A figure with long streaming hair and a stick. Length drawn as hair left uncut.",
 words:[["好長","hou2 coeng4","very long"],["長褲","coeng4 fu3","trousers"]],
 sent:["條隊好長呀。","tiu4 deoi2 hou2 coeng4 aa3","The queue is very long."]},
{c:"短",p:"dyun2",m:"short",comp:["矢"],pos:["adj"],
 story:"The partner of 長. Note the vowel — dyun2 starts with a d, then glides through a y.",
 o:"An arrow (矢) beside 豆, a stemmed dish. Short things were measured against an arrow; long ones against a bow.",
 words:[["好短","hou2 dyun2","very short"],["短褲","dyun2 fu3","shorts"]],
 sent:["時間好短。","si4 gaan3 hou2 dyun2","There's very little time."]},
{c:"得",p:"dak1",m:"can; OK; to get",comp:["彳"],pos:["v","adj"],
 story:"得 on its own means 'that works'. 得唔得呀？ is 'is that alright?' — and 唔得 is a flat no.",
 o:"A step (彳) with a hand taking a shell. Getting hold of something, then being able to.",
 words:[["得唔得","dak1 m4 dak1","is that OK?"],["唔得","m4 dak1","no; can't"],["得閒","dak1 haan4","free; not busy"]],
 sent:["聽日得唔得呀？","ting1 jat6 dak1 m4 dak1 aa3","Would tomorrow work?"]},
{c:"閒",p:"haan4",m:"free; idle",comp:["門","月"],pos:["adj"],
 story:"得閒 dak1 haan4 is how you ask if someone is free. 唔得閒 — busy — is the standard Hong Kong excuse.",
 o:"A gate (門) with the moon (月) showing through the gap — the house shut for the night and nobody coming or going. Leisure drawn as a quiet doorway.",
 words:[["得閒","dak1 haan4","free; not busy"],["唔得閒","m4 dak1 haan4","busy"]],
 sent:["你聽日得唔得閒？","nei5 ting1 jat6 dak1 m4 dak1 haan4","Are you free tomorrow?"]},
{c:"攰",p:"gui6",m:"tired",comp:["力"],pos:["adj"],
 story:"好攰 — knackered. Another character that exists for Cantonese and nothing else.",
 o:"Strength (力) with 尥 for the sound. Strength, spent.",
 words:[["好攰","hou2 gui6","very tired"],["攰死","gui6 sei2","exhausted"]],
 sent:["今日返工好攰。","gam1 jat6 faan1 gung1 hou2 gui6","Work was exhausting today."]}
);

/* ---------- Stage 10 · 語氣 — the little words on the end of a sentence that carry everything english puts in the voice ---------- */
HQ.push(
{c:"咗",p:"zo2",m:"(completed action marker)",comp:["口","左"],pos:["part-asp"],
 story:"Put it after a verb and the thing is done: 食咗 ate, 買咗 bought, 去咗 went. This is Cantonese's 了.",
 o:"A mouth (口) with 左, left, for the sound. Cantonese-only, and so common that no page of written Cantonese lacks it.",
 words:[["食咗","sik6 zo2","ate; have eaten"],["買咗","maai5 zo2","bought"],["去咗","heoi3 zo2","went"]],
 sent:["我食咗飯喇。","ngo5 sik6 zo2 faan6 laa3","I've eaten."]},
{c:"緊",p:"gan2",m:"(ongoing action marker)",comp:["糸"],pos:["part-asp"],
 story:"The -ing of Cantonese. 食緊 is eating right now, 做緊 is in the middle of doing. Compare 咗, which closes an action off.",
 o:"Silk (糸) under a hand holding firm — pulled tight. The grammatical use grew out of 'holding on'.",
 words:[["食緊","sik6 gan2","eating"],["做緊","zou6 gan2","doing"],["學緊","hok6 gan2","learning"]],
 sent:["我做緊嘢。","ngo5 zou6 gan2 je5","I'm working."]},
{c:"過",p:"gwo3",m:"to pass; (have done before)",comp:["辶"],pos:["v","part-asp"],
 story:"After a verb it means you have done it at some point: 食過 have eaten (before), 去過 have been.",
 o:"The walking radical (辶) with 咼 for the sound. Passing by, then passing through time.",
 words:[["去過","heoi3 gwo3","have been to"],["食過","sik6 gwo3","have eaten before"],["過嚟","gwo3 lai4","come over"]],
 sent:["我去過香港。","ngo5 heoi3 gwo3 hoeng1 gong2","I've been to Hong Kong."]},
{c:"埋",p:"maai4",m:"to close up; as well",comp:["土"],pos:["v","part"],
 story:"Hard to translate and everywhere. 食埋 means finish eating it; 埋單 maai4 daan1 is asking for the bill, the phrase that ends every meal.",
 o:"Earth (土) with 里 for the sound — to bury. From closing a hole came closing anything off.",
 words:[["埋單","maai4 daan1","the bill, please"],["食埋","sik6 maai4","finish eating it"],["行埋","haang4 maai4","come closer"]],
 sent:["唔該埋單。","m4 goi1 maai4 daan1","The bill, please."]},
{c:"晒",p:"saai3",m:"(completely; the lot)",comp:["日","西"],pos:["part"],
 story:"Tacked on, it means 'all of it': 食晒 ate the lot. It is also what makes 唔該晒 and 多謝晒 sound properly grateful rather than merely polite.",
 o:"The sun (日) with 西 for the sound — to dry something through in the sun, written in full as 曬. Hong Kong writes the particle with the short form, and that is the one you will read.",
 words:[["唔該晒","m4 goi1 saai3","thanks very much"],["多謝晒","do1 ze6 saai3","thank you very much"],["食晒","sik6 saai3","ate it all"]],
 sent:["佢食晒啲飯。","keoi5 sik6 saai3 di1 faan6","He ate all the rice."]},
{c:"啦",p:"laa1",m:"(suggesting particle)",comp:["口","拉"],pos:["part"],
 story:"Turns a statement into a suggestion. 去啦 is 'let's go' — warm, where a bare 去 would be an order.",
 o:"A mouth (口) with 拉 for the sound. Every final particle in Cantonese is built this way.",
 words:[["好啦","hou2 laa1","alright then"],["走啦","zau2 laa1","let's go"],["食飯啦","sik6 faan6 laa1","let's eat"]],
 sent:["我哋走啦。","ngo5 dei6 zau2 laa1","Let's get going."]},
{c:"喇",p:"laa3",m:"(change-of-state particle)",comp:["口","剌"],pos:["part"],
 story:"One tone away from 啦 and a different job: 喇 laa3 says something has changed. 食咗喇 — I've eaten (now).",
 o:"A mouth (口) with 剌 for the sound. The tone is the whole difference between suggesting and reporting.",
 words:[["好喇","hou2 laa3","that's enough; OK now"],["夠喇","gau3 laa3","that's plenty"]],
 sent:["夠喇，唔該。","gau3 laa3 m4 goi1","That's enough, thanks."]},
{c:"喎",p:"wo3",m:"(reporting / reminding particle)",comp:["口","咼"],pos:["part"],
 story:"Adds a raised eyebrow — passing on news, or pointing something out. 佢唔嚟喎 is 'apparently he's not coming'.",
 o:"A mouth (口) with 咼 for the sound. Dictionaries list waa1; the particle everyone uses is wo3.",
 words:[["係喎","hai6 wo3","oh, that's right"],["唔得喎","m4 dak1 wo3","that won't do, you know"]],
 sent:["係喎，我唔記得咗。","hai6 wo3 ngo5 m4 gei3 dak1 zo2","Oh right — I'd forgotten."]},
{c:"囉",p:"lo1",m:"(obviously / resigned particle)",comp:["口","羅"],pos:["part"],
 story:"A shrug in one syllable — 'well, obviously'. 係囉 agrees with a sigh behind it.",
 o:"A mouth (口) with 羅 for the sound.",
 words:[["係囉","hai6 lo1","yeah, exactly"],["咁囉","gam2 lo1","that's just how it is"]],
 sent:["冇辦法囉。","mou5 baan6 faat3 lo1","Nothing to be done, then."]},
{c:"先",p:"sin1",m:"first; only then",comp:[],pos:["adv"],
 story:"It goes after the verb, not before: 我食飯先 is 'let me eat first'. Mandarin puts 先 in front, which is the commonest place learners slip.",
 o:"A foot (止) over a person — someone a step ahead. Priority drawn as position.",
 words:[["我先","ngo5 sin1","me first"],["先啦","sin1 laa1","in a moment; later"]],
 sent:["等我食飯先。","dang2 ngo5 sik6 faan6 sin1","Let me eat first."]},
{c:"啱",p:"ngaam1",m:"correct; to suit; just now",comp:["口"],pos:["adj","adv"],
 story:"啱 means right, and 啱啱 means just a moment ago. That ng- at the front is the sound that marks a native speaker.",
 o:"A mouth (口) with 岩 for the sound. Cantonese-only.",
 words:[["啱啱","ngaam1 ngaam1","just now"],["啱唔啱","ngaam1 m4 ngaam1","is that right?"],["好啱","hou2 ngaam1","just right"]],
 sent:["佢啱啱走咗。","keoi5 ngaam1 ngaam1 zau2 zo2","He left just now."]},
{c:"都",p:"dou1",m:"also; all",comp:["者"],pos:["adv"],
 story:"Like 先, it sits before the verb: 我都係 is 'me too'. It covers both 'also' and 'all'.",
 o:"A city wall (阝) with 者 for the sound — a capital, where everyone gathers. From 'all gathered' came 'all'.",
 words:[["都係","dou1 hai6","also is; might as well"],["都得","dou1 dak1","either is fine"],["乜都得","mat1 dou1 dak1","anything's fine"]],
 sent:["我都係學生。","ngo5 dou1 hai6 hok6 saang1","I'm a student too."]},
{c:"仲",p:"zung6",m:"still; even more",comp:["人","中"],pos:["adv"],
 story:"Where Mandarin says 還, Cantonese says 仲. 仲有 is 'there's still more'.",
 o:"A person (亻) with the middle (中) for the sound. Mandarin keeps it only in 仲裁 (arbitration); Cantonese made it an everyday adverb.",
 words:[["仲有","zung6 jau5","and also; still have"],["仲未","zung6 mei6","not yet"],["仲要","zung6 jiu3","and also want"]],
 sent:["我仲未食飯。","ngo5 zung6 mei6 sik6 faan6","I haven't eaten yet."]},
{c:"就",p:"zau6",m:"then; right away",comp:[],pos:["adv"],
 story:"Joins two halves of a thought — 食咗飯就走, 'eat, then go'. It also means 'about to'.",
 o:"A tall building (京) beside 尤 — to go up to, to approach. From approaching came 'then'.",
 words:[["就嚟","zau6 lai4","almost; about to"],["就係","zau6 hai6","that's exactly it"],["就走","zau6 zau2","leave right away"]],
 sent:["我食完就返屋企。","ngo5 sik6 jyun4 zau6 faan1 uk1 kei2","I'll go home as soon as I've eaten."]}
);

/* ============================================================
   Grammar tags, stages, tiers
   ============================================================ */

const POS_LABEL = {
  num: "number", n: "noun", v: "verb", adj: "adjective", pron: "pronoun",
  adv: "adverb", conj: "connective", mw: "measure word", loc: "position word",
  cov: "preposition", aux: "modal verb",
  "part-q": "question word", "part-asp": "aspect particle",
  "part-str": "linking particle", "part-pl": "plural marker", part: "final particle"
};

/* The teaching order is by what gets you through a day, not by frequency.
   A frequency list for written Cantonese would put 的 and 是 near the top,
   because most writing in Hong Kong is Standard Chinese — and you would learn
   to read a newspaper without being able to order a coffee. */
const STAGES = [
  {n:1, icon:"👋", name:"Saying hello", zh:"打招呼", end:16,  core:true, blurb:"Nine phrases you can use on the way out of the first week: hello, good morning, good night, thank you, sorry, goodbye."},
  {n:2, icon:"🧍", name:"Who", zh:"我哋", end:29,  core:true, blurb:"People, and the particles that hold a Cantonese sentence together."},
  {n:3, icon:"🔢", name:"Numbers", zh:"一二三", end:42,  core:true, blurb:"Counting, and the 二 / 兩 distinction that catches everyone."},
  {n:4, icon:"🍜", name:"Eating", zh:"飲食", end:59,  core:true, blurb:"Ordering at a cha chaan teng: hot or iced, more or less sugar."},
  {n:5, icon:"🗺️", name:"Places", zh:"去邊度", end:77,  core:true, blurb:"Asking where something is, and getting on and off things to reach it."},
  {n:6, icon:"🕐", name:"Time", zh:"幾點", end:90,  core:true, blurb:"Clock and calendar, including the words for morning and lunch that Mandarin doesn't have."},
  {n:7, icon:"👨‍👩‍👧", name:"Family", zh:"屋企人", end:101,  core:true, blurb:"The people around you, and the prefix 老 that isn't about age."},
  {n:8, icon:"🏃", name:"Doing", zh:"做乜嘢", end:117,  core:true, blurb:"The verbs a day is made of — and the ones Cantonese keeps where Mandarin moved on."},
  {n:9, icon:"📏", name:"Describing", zh:"點形容", end:132,  core:true, blurb:"Big, small, cheap, tired — and the tone pairs that mean opposite things."},
  {n:10, icon:"💬", name:"Particles", zh:"語氣", end:146,  core:true, blurb:"The little words on the end of a sentence that carry everything English puts in the voice."}
];

/* Two doors rather than three: the library is 145 characters, not 763, and a
   third gate would be a locked door with nothing behind it. */
const TIERS = [
  {n:1, icon:"🥢", name:"Getting by",  zh:"過日辰", to:77,
   blurb:"Enough to greet someone, count, order food and say where you're going."},
  {n:2, icon:"🗣️", name:"Holding up",  zh:"傾得",   to:146,
   blurb:"Time, family, the everyday verbs, and the particles that make you sound like a person rather than a phrasebook."}
];

const TIER_UNLOCK = 0.8;

HQ.forEach((ch, i) => {
  ch.i = i;
  ch.stage = STAGES.find(s => i < s.end).n;
});

const CHAR_INDEX = {};
HQ.forEach(ch => { CHAR_INDEX[ch.c] = ch; });

/* Component families — derived, so adding characters extends the trees for free. */
const FAMILIES = {};
HQ.forEach(ch => {
  ch.comp.forEach(k => {
    if (!FAMILIES[k]) FAMILIES[k] = [];
    FAMILIES[k].push(ch.c);
  });
});

/* ============================================================
   Radicals — the semantic parts that organise the writing system.
   Keyed by the base form used in `comp`, and read in Cantonese.
   ============================================================ */

const RADICALS = {
  "口": {form:"口", variants:"", name:"mouth", pin:"hau2", strokes:3,
    does:"Eating, drinking, speaking and shouting — and, in Cantonese above all, particles. 嘅, 咩, 呢, 嗰, 哋, 咗, 喺, 嘢 all carry it, because written Cantonese built its grammar words by putting a mouth beside a character that sounded right."},
  "人": {form:"亻", variants:"人 亻", name:"person", pin:"jan4", strokes:2,
    does:"On the left edge it squeezes to 亻. It marks people, roles, and things people do to each other — 你, 佢, 係, 仔, 住, 做."},
  "水": {form:"氵", variants:"水 氵", name:"water", pin:"seoi2", strokes:3,
    does:"Three drops on the left. Every liquid, every river, and every action involving washing or pouring. Frozen to two drops (冫) it gives you 凍."},
  "火": {form:"灬", variants:"火 灬", name:"fire", pin:"fo2", strokes:4,
    does:"Under a character it flattens into four dots. Those dots at the bottom of 熱 and 點 are fire, not water."},
  "木": {form:"木", variants:"", name:"tree; wood", pin:"muk6", strokes:4,
    does:"Anything made of wood, and the trees it came from — 杯, 茶, 閒."},
  "言": {form:"言", variants:"言 訁", name:"speech", pin:"jin4", strokes:7,
    does:"Said out loud, or written down: 講, 話, 請, 謝, 識, 該."},
  "食": {form:"飠", variants:"食 飠", name:"food", pin:"sik6", strokes:9,
    does:"Eating and drinking, and everything cooked — 飲, 飯."},
  "女": {form:"女", variants:"", name:"woman", pin:"neoi5", strokes:3,
    does:"Women, family relationships, and a long tail of characters that borrowed it early — 好, 媽, 姐, 妹, 婆, 安, 奶."},
  "目": {form:"目", variants:"", name:"eye", pin:"muk6", strokes:5,
    does:"Looking and sleeping: 睇, 瞓, 見."},
  "日": {form:"日", variants:"", name:"sun; day", pin:"jat6", strokes:4,
    does:"The sun, and every division of time it measures — 早, 晚, 晏, 星, 曬."},
  "月": {form:"月", variants:"", name:"moon; month", pin:"jyut6", strokes:4,
    does:"Months and moonlight. Be careful: the 月 in 有 and 朋 is really 肉 (flesh), a different part that collapsed into the same shape."},
  "心": {form:"忄", variants:"心 忄 ⺗", name:"heart", pin:"sam1", strokes:4,
    does:"Feeling and thinking, which Chinese has always put in the heart rather than the head — 快, 慢, 聽."},
  "手": {form:"扌", variants:"手 扌", name:"hand", pin:"sau2", strokes:4,
    does:"Anything done with the hands. Hidden inside 我, which was once a hand holding a blade."},
  "門": {form:"門", variants:"門 门", name:"gate", pin:"mun4", strokes:8,
    does:"Doors, and what happens at them — 問, 閒."},
  "貝": {form:"貝", variants:"貝 贝", name:"cowrie shell", pin:"bui3", strokes:7,
    does:"Money. Shells were currency three thousand years ago, and every character about buying, selling or value still carries one — 買, 賣, 貴."},
  "辶": {form:"辶", variants:"辵 辶", name:"walking", pin:"coek3", strokes:3,
    does:"The sweeping stroke under a character means movement along a road — 返, 過, 邊."},
  "糸": {form:"糸", variants:"糸 纟", name:"silk", pin:"mik6", strokes:6,
    does:"Thread, cloth, and by extension anything fine or tightly held — 細, 緊."},
  "艸": {form:"艹", variants:"艸 艹", name:"grass", pin:"cou2", strokes:3,
    does:"Two strokes across the top for anything that grows — 茶, 菜, 落."},
  "土": {form:"土", variants:"", name:"earth", pin:"tou2", strokes:3,
    does:"Ground, and what is built on it — 去, 坐, 埋, 街."},
  "金": {form:"金", variants:"金 钅", name:"metal", pin:"gam1", strokes:8,
    does:"Metal and everything made from it, including bells and so clocks — 鐘."},
  "力": {form:"力", variants:"", name:"strength", pin:"lik6", strokes:2,
    does:"A drawing of a muscled arm. Effort, and running out of it — 攰."},
  "立": {form:"立", variants:"", name:"to stand", pin:"laap6", strokes:5,
    does:"A person standing on the ground line — 站."},
  "父": {form:"父", variants:"", name:"father", pin:"fu6", strokes:4,
    does:"A hand holding a stick. Authority, drawn bluntly — 爸."},
  "耳": {form:"耳", variants:"", name:"ear", pin:"ji5", strokes:6,
    does:"Hearing — 聽."},
  "米": {form:"米", variants:"", name:"rice", pin:"mai5", strokes:6,
    does:"Grain, and things refined from it — 糖."},
  "石": {form:"石", variants:"", name:"stone", pin:"sek6", strokes:5,
    does:"Rock, and vessels ground out of it — 碗."},
  "子": {form:"子", variants:"", name:"child", pin:"zi2", strokes:3,
    does:"A swaddled baby, arms out. Children and learning — 好, 仔, 學."}
};

/* ============================================================
   茶餐廳 — the side quest

   A cha chaan teng is Hong Kong's own invention: a diner serving Western food
   as reimagined through a Cantonese kitchen, at speed, on a laminated menu
   nobody has time to explain to you. Reading one is a genuine test, because
   the menu is written in Cantonese shorthand rather than Standard Chinese —
   凍 for iced, 少甜 for less sugar, 走 for "hold the".

   Prices are in Hong Kong dollars.
   ============================================================ */

const MENU = {
  title: "餐牌",
  name: "好運茶餐廳",
  en: "Ho Wan Cha Chaan Teng · 旺角 Mong Kok",
  sections: [
    { head: "飲品", en: "Drinks", items: [
      ["奶茶",     "naai5 caa4",          "milk tea",              22, ["熱定凍？","jit6 ding6 dung3","hot or iced?"]],
      ["凍檸茶",   "dung3 ning4 caa4",    "iced lemon tea",        24, ["少甜得唔得？","siu2 tim4 dak1 m4 dak1","less sugar, alright?"]],
      ["熱咖啡",   "jit6 gaa3 fe1",       "hot coffee",            22, ["好香","hou2 hoeng1","very fragrant"]],
      ["好立克",   "hou2 laap6 hak1",     "Horlicks",              24, ["茶記嘅嘢","caa4 gei3 ge3 je5","a diner classic"]],
      ["凍水",     "dung3 seoi2",         "iced water",             5, ["唔使錢","m4 sai2 cin2","free"]]
    ]},
    { head: "包", en: "Buns and toast", items: [
      ["菠蘿包",   "bo1 lo4 baau1",       "pineapple bun",         12, ["冇菠蘿嘅","mou5 bo1 lo4 ge3","contains no pineapple"]],
      ["菠蘿油",   "bo1 lo4 jau4",        "pineapple bun, buttered",15, ["一大嚿牛油","jat1 daai6 gau6 ngau4 jau4","a cold slab of butter"]],
      ["西多士",   "sai1 do1 si2",        "French toast",          28, ["好甜，好熱","hou2 tim4 hou2 jit6","sweet and very hot"]],
      ["奶油多",   "naai5 jau4 do1",      "butter and condensed milk toast", 18, ["好邪惡","hou2 ce4 ok3","gloriously bad for you"]]
    ]},
    { head: "麵飯", en: "Noodles and rice", items: [
      ["雲吞麵",   "wan4 tan1 min6",      "wonton noodles",        38, ["細蓉","sai3 jung2","the small bowl, if you know"]],
      ["牛腩麵",   "ngau4 naam5 min6",    "beef brisket noodles",  46, ["炆咗好耐","man1 zo2 hou2 noi6","braised for hours"]],
      ["乾炒牛河", "gon1 caau2 ngau4 ho2","beef chow fun",         58, ["鑊氣夠唔夠？","wok6 hei3 gau3 m4 gau3","enough wok breath?"]],
      ["叉燒飯",   "caa1 siu1 faan6",     "char siu over rice",    48, ["肥啲好食啲","fei4 di1 hou2 sik6 di1","the fattier the better"]],
      ["餐蛋麵",   "caan1 daan2 min6",    "spam and egg noodles",  36, ["茶記招牌","caa4 gei3 ziu1 paai4","the diner standard"]]
    ]},
    { head: "小菜", en: "Dishes", items: [
      ["白切雞",   "baak6 cit3 gai1",     "poached chicken",       78, ["要薑蓉","jiu3 goeng1 jung2","with ginger and spring onion"]],
      ["蒸魚",     "zing1 jyu2",          "steamed fish",          98, ["今日新鮮","gam1 jat6 san1 sin1","fresh in today"]],
      ["炒青菜",   "caau2 cing1 coi3",    "stir-fried greens",     36, ["睇下今日有咩","tai2 haa5 gam1 jat6 jau5 me1","whatever came in"]]
    ]},
    { head: "湯", en: "Soup", items: [
      ["羅宋湯",   "lo4 sung3 tong1",     "borscht",               18, ["茶記版本","caa4 gei3 baan2 bun2","the Hong Kong version"]],
      ["今日例湯", "gam1 jat6 lai6 tong1","today's soup",          16, ["日日唔同","jat6 jat6 m4 tung4","different every day"]]
    ]}
  ],
  specials: {
    head: "常餐", en: "The all-day set",
    items: [
      ["常餐：餐蛋麵、多士、奶茶", "soeng4 caan1 caan1 daan2 min6 do1 si2 naai5 caa4", "set: spam and egg noodles, toast, milk tea", 52],
      ["快餐：叉燒飯、例湯、凍檸茶", "faai3 caan1 caa1 siu1 faan6 lai6 tong1 dung3 ning4 caa4", "set: char siu rice, soup of the day, iced lemon tea", 62],
      ["下午茶：西多士、熱奶茶", "haa6 ng5 caa4 sai1 do1 si2 jit6 naai5 caa4", "afternoon tea: French toast and hot milk tea", 42]
    ],
    note: ["下午茶三點到五點半。", "haa6 ng5 caa4 saam1 dim2 dou3 ng5 dim2 bun3.",
           "Afternoon tea runs from three to half past five."]
  },
  phrases: [
    ["唔該，我要個餐牌。",   "m4 goi1 ngo5 jiu3 go3 caan1 paai2","Could I have the menu?"],
    ["我要一碗雲吞麵。",     "ngo5 jiu3 jat1 wun2 wan4 tan1 min6","I'd like a bowl of wonton noodles."],
    ["凍奶茶，少甜。",       "dung3 naai5 caa4 siu2 tim4","Iced milk tea, less sugar."],
    ["呢個幾多錢呀？",       "ni1 go3 gei2 do1 cin2 aa3","How much is this one?"],
    ["唔該埋單！",           "m4 goi1 maai4 daan1","The bill, please!"]
  ]
};

/* Every distinct character the quest covers, derived from the menu above so
   editing it keeps the quest honest. Characters actually PRINTED on the menu
   come first: learning one should visibly light up a dish, not a phrase you
   can't see. Ordering-phrase characters follow, each tier in teaching order. */
const MENU_CHARS = (() => {
  const printed = new Set(), spoken = new Set();
  const add = (str, set) => [...str].forEach(c => { if (/[一-鿿]/.test(c)) set.add(c); });
  add(MENU.title, printed); add(MENU.name, printed);
  MENU.sections.forEach(s => { add(s.head, printed); s.items.forEach(i => add(i[0], printed)); });
  /* The descriptions and the set-lunch board are printed too — they arrive at
     menu tiers 2 and 3 rather than on day one, but they are on the wall, and a
     character you can read there should count towards reading the menu. */
  MENU.sections.forEach(s => s.items.forEach(i => { if (i[4]) add(i[4][0], spoken); }));
  MENU.specials.items.forEach(i => add(i[0], spoken));
  add(MENU.specials.head, spoken); add(MENU.specials.note[0], spoken);
  MENU.phrases.forEach(p => add(p[0], spoken));
  return HQ.filter(ch => printed.has(ch.c) || spoken.has(ch.c))
           .map((ch, n) => ({ c: ch.c, tier: printed.has(ch.c) ? 0 : 1, n }))
           .sort((a, b) => a.tier - b.tier || a.n - b.n)
           .map(x => x.c);
})();

const MENU_TIERS = [
  { n: 1, at: 0,  label: "Dish names only" },
  { n: 2, at: 12, label: "With what the waiter says" },
  { n: 3, at: 24, label: "Full menu, set lunches and all" }
];

const QUESTS = [
  { id:"menu",   icon:"🍜", name:"Read a Cha Chaan Teng", zh:"睇餐牌", open:true,
    promise:"Walk into a Hong Kong diner, read the laminated menu on the wall, and order out loud.",
    chars: MENU_CHARS, menu: MENU },
  { id:"street", icon:"🚇", name:"Find Your Way",  zh:"搭車",   locked:true,
    promise:"MTR exits, minibus signs and street names.",          needs:"Read a Cha Chaan Teng" },
  { id:"shop",   icon:"🛒", name:"Buy Something",  zh:"買嘢",   locked:true,
    promise:"Prices, sizes, and asking for it a bit cheaper.",     needs:"Find Your Way" },
  { id:"chat",   icon:"💬", name:"Small Talk",     zh:"傾偈",   locked:true,
    promise:"Hold a short conversation about yourself.",           needs:"Buy Something" }
];

/* ============================================================
   Interests — what the word of the week is drawn from.

   Runs alongside the curriculum rather than through it: one real word a week,
   often built from characters well past where you have got to. Nothing here
   is scheduled, graded or counted.

   Each word: [hanzi, jyutping, meaning, a line worth knowing about it].
   ============================================================ */

const INTERESTS = {
  food:   { icon: "🍜", name: "Food & eating out", zh: "飲食", words: [
    ["鑊氣","wok6 hei3","wok breath","Untranslatable and non-negotiable. The scorched, smoky note a dish only gets from a screaming-hot wok. A plate of 乾炒牛河 without it is sent back."],
    ["飲茶","jam2 caa4","to go for dim sum","Literally 'drink tea'. The tea is the least of it, but it is what the outing is named after."],
    ["加底","gaa1 dai2","extra rice","'Add to the base'. Its opposite, 走底, means hold the rice. Cha chaan teng shorthand is a language of its own."],
    ["打冷","daa2 laang5","Chiu Chow late-night food","Cold braised dishes pointed at rather than ordered, eaten after midnight."],
    ["食晏","sik6 aan3","to have lunch","Mandarin has no 晏. Cantonese kept the old word for midday and built a meal around it."]
  ]},
  city:   { icon: "🏙️", name: "Hong Kong", zh: "香港", words: [
    ["行山","haang4 saan1","to go hiking","Three quarters of Hong Kong is country park. The city is denser than anywhere on earth and twenty minutes from a ridge."],
    ["紅Van","hung4 ven1","red minibus","No fixed timetable, no fixed stops. You shout 有落 when you want to get off."],
    ["叮叮","ding1 ding1","the tram","Named for its bell. It has run along the north shore since 1904 and still costs almost nothing."],
    ["劏房","tong1 fong2","subdivided flat","A flat cut into several. The word 劏 means to butcher, and it was chosen deliberately."],
    ["返工","faan1 gung1","to go to work","Literally 'return to work' — as though you had always been going back."]
  ]},
  talk:   { icon: "💬", name: "Slang & how people talk", zh: "口語", words: [
    ["搞掂","gaau2 dim6","sorted; done","The most satisfying two syllables in the language. Said with a nod."],
    ["唔好意思","m4 hou2 ji3 si1","sorry; excuse me","Softer than 對唔住. For bumping into someone, not for letting them down."],
    ["得閒飲茶","dak1 haan4 jam2 caa4","let's get tea sometime","Said on parting, and almost never meant literally. Hong Kong's 'we should catch up'."],
    ["冇眼睇","mou5 ngaan5 tai2","I can't watch this","Literally 'no eyes to look'. For secondhand embarrassment."],
    ["加油","gaa1 jau2","keep going; you've got this","Add oil. It entered the Oxford English Dictionary in 2018, from Hong Kong."]
  ]},
  screen: { icon: "🎬", name: "Film & music", zh: "影視", words: [
    ["粵語殘片","jyut6 jyu5 caan4 pin2","old black-and-white Cantonese film","Literally 'ruined film'. Affectionate, for the 1950s and 60s pictures shown on afternoon television."],
    ["無厘頭","mou4 lei4 tau4","nonsense comedy","The Stephen Chow genre. Literally 'without a head to it'."],
    ["K歌","kei1 go1","a karaoke song","Cantopop written to be sung badly by other people, which is a real craft."],
    ["字幕","zi6 mok6","subtitles","Hong Kong films were subtitled in Chinese and English from the start, because the audience never all spoke one language."]
  ]}
};

const INTEREST_KEYS = Object.keys(INTERESTS);

/* ============================================================
   Festivals — the Hong Kong calendar.

   A festival in the current week outranks anything the interests would offer,
   and is never shown twice.
   ============================================================ */

const FESTIVALS = [
  { key:"newyear", icon:"🎊", name:"New Year's Day", zh:"元旦", on:"01-01", words:[
    ["新年","san1 nin4","new year","新年快樂 for the Gregorian one. The lunar one gets its own greeting entirely."],
    ["倒數","dou2 sou2","countdown","Counting backwards. What the harbour fireworks are for."],
    ["新開始","san1 hoi1 ci2","a fresh start","Made in the first week, abandoned in the third, in every language."],
    ["煙花","jin1 faa1","fireworks","Smoke-flower. Fired over Victoria Harbour, watched from both sides of it."],
    ["假期","gaa3 kei4","holiday","A public one. Hong Kong keeps both the Gregorian new year and the lunar one."]
  ]},
  { key:"cny", icon:"🧧", name:"Lunar New Year", zh:"農曆新年", lunar:{
      2026:"02-17", 2027:"02-06", 2028:"01-26", 2029:"02-13", 2030:"02-03",
      2031:"01-23", 2032:"02-11", 2033:"01-31", 2034:"02-19", 2035:"02-08" }, words:[
    ["恭喜發財","gung1 hei2 faat3 coi4","wishing you prosperity","Said with cupped hands. In Hong Kong the usual reply is 利是逗來 — now hand over the red packet."],
    ["利是","lai6 si6","red packet","Written 利是 in Hong Kong, 紅包 up north. Given by married people to unmarried ones, and now sent by phone."],
    ["團年飯","tyun4 nin4 faan6","reunion dinner","The one meal of the year everyone is expected home for."],
    ["年花","nin4 faa1","New Year flowers","Peach blossom for luck in love, kumquat for money. Bought at the flower market the night before."],
    ["逗利是","dau6 lai6 si6","to collect red packets","A verb. Children are very good at it."]
  ]},
  { key:"chingming", icon:"🌿", name:"Ching Ming", zh:"清明節", on:"04-04", words:[
    ["拜山","baai3 saan1","to visit the graves","Literally 'pay respects to the mountain', because that is where Hong Kong's cemeteries are."],
    ["祖先","zou2 sin1","ancestors","Remembered rather than mourned. Food is brought, and then eaten."],
    ["燒衣","siu1 ji1","burning paper offerings","Paper clothes, paper phones, paper flats. Sent on ahead."],
    ["山墳","saan1 fan4","a grave","Hong Kong buries its dead on hillsides, which is why visiting them is called climbing."],
    ["清明","cing1 ming4","Clear and Bright","The solar term the festival is named after — the point in spring when the air clears."]
  ]},
  { key:"buddha", icon:"🪷", name:"Buddha's Birthday", zh:"佛誕", lunar:{
      2026:"05-24", 2027:"05-13", 2028:"05-02", 2029:"05-20", 2030:"05-09",
      2031:"05-28", 2032:"05-16", 2033:"05-06", 2034:"05-25", 2035:"05-15" }, words:[
    ["佛誕","fat6 daan3","Buddha's Birthday","A public holiday. The Big Buddha on Lantau is unreachable for the crowds."],
    ["浴佛","juk6 fat6","bathing the Buddha","Pouring water over a small statue. The central rite of the day."],
    ["長洲太平清醮","coeng4 zau1 taai3 ping4 cing1 ziu3","the Cheung Chau Bun Festival","Same week. Teams race up a tower of buns, and the whole island goes vegetarian for three days."],
    ["平安包","ping4 on1 baau1","peace bun","Stamped with 平安 in red. Taken home from Cheung Chau by the bagful."],
    ["飄色","piu1 sik1","the floating children parade","Children strapped to concealed steel frames so they appear to float above the crowd."],
    ["搶包山","coeng2 baau1 saan1","the bun scramble","Up a tower of buns, at midnight, on a rope. It was banned for decades after one collapsed."]
  ]},
  { key:"dragon", icon:"🐉", name:"Dragon Boat Festival", zh:"端午節", lunar:{
      2026:"06-19", 2027:"06-09", 2028:"05-28", 2029:"06-16", 2030:"06-05",
      2031:"06-24", 2032:"06-12", 2033:"06-01", 2034:"06-20", 2035:"06-10" }, words:[
    ["龍舟","lung4 zau1","dragon boat","Crewed by twenty paddlers, a drummer and a steersman. Every fishing village races."],
    ["糉","zung2","sticky rice dumpling","Wrapped in bamboo leaf and tied with string. Eaten only at this time of year."],
    ["扒龍舟","paa4 lung4 zau1","to race a dragon boat","The verb is the one for pulling an oar."],
    ["鼓手","gu2 sau2","the drummer","Sits at the bow facing the crew and sets the stroke. The hardest seat to do well."],
    ["屈原","wat1 jyun4","Qu Yuan","The poet the festival remembers, who drowned himself; the dumplings were thrown in to keep the fish off him."]
  ]},
  { key:"midautumn", icon:"🥮", name:"Mid-Autumn Festival", zh:"中秋節", lunar:{
      2026:"09-25", 2027:"09-15", 2028:"10-03", 2029:"09-22", 2030:"09-12",
      2031:"10-01", 2032:"09-19", 2033:"09-08", 2034:"09-27", 2035:"09-16" }, words:[
    ["月餅","jyut6 beng2","mooncake","Dense, expensive, and given rather than eaten. The lotus paste ones with a salted yolk are the standard."],
    ["燈籠","dang1 lung4","lantern","Children carry them through the parks after dark. Victoria Park is full of them."],
    ["賞月","soeng2 jyut6","moon-gazing","The actual point of the evening. The moon is at its fullest and roundest."],
    ["人月兩團圓","jan4 jyut6 loeng5 tyun4 jyun4","family and moon, both round","The wish of the festival: the moon is full and everyone is home."],
    ["柚子","jau2 zi2","pomelo","Eaten after the mooncake, because by then you need it."]
  ]},
  { key:"chungyeung", icon:"⛰️", name:"Chung Yeung", zh:"重陽節", lunar:{
      2026:"10-18", 2027:"10-08", 2028:"10-26", 2029:"10-16", 2030:"10-05",
      2031:"10-24", 2032:"10-12", 2033:"10-01", 2034:"10-20", 2035:"10-09" }, words:[
    ["登高","dang1 gou1","to climb high","The custom of the day: get up a hill. A public holiday in Hong Kong, and the paths are packed."],
    ["拜山","baai3 saan1","to visit the graves","The autumn half of the pair with Ching Ming."],
    ["重陽","cung4 joeng4","Double Ninth","The ninth day of the ninth month — two nines, and nine is the yang number."],
    ["行山","haang4 saan1","to go hiking","What most of Hong Kong actually does with the holiday."],
    ["菊花酒","guk1 faa1 zau2","chrysanthemum wine","Drunk on the day since the Han dynasty, and now mostly not."]
  ]},
  { key:"christmas", icon:"🎄", name:"Christmas", zh:"聖誕節", on:"12-25", words:[
    ["聖誕快樂","sing3 daan3 faai3 lok6","Merry Christmas","A public holiday, and the harbour buildings are lit up for a month either side."],
    ["聖誕大餐","sing3 daan3 daai6 caan1","Christmas dinner","Booked in October. Hong Kong takes the eating very seriously and the religion not at all."],
    ["聖誕燈飾","sing3 daan3 dang1 sik1","the Christmas lights","Hung on the harbour-front towers for a month either side, and visible from the far shore."],
    ["交換禮物","gaau1 wun6 lai5 mat6","a gift exchange","Office ritual. The budget is agreed in advance and quietly ignored."],
    ["拆禮物日","caak3 lai5 mat6 jat6","Boxing Day","Literally 'unwrap the presents day', which is a better name for it than the English one."],
    ["報佳音","bou3 gaai1 jam1","carolling","'Reporting the good sound'. Church groups do the rounds of the housing estates."]
  ]}
];

/* ---------- simplified cross-reference ----------
   Generated by tools/fetch-simplified.mjs from Unihan's kSimplifiedVariant.
   Do not hand-edit: every hand-written version of this has been wrong.
   37 of 145 characters are written differently in simplified script. */
const SIMPLIFIED = {"係":"系","個":"个","兩":"两","幾":"几","該":"该","謝":"谢","對":"对","請":"请","問":"问","見":"见","飲":"饮","飯":"饭","麵":"面","凍":"冻","熱":"热","邊":"边","車":"车","聽":"听","點":"点","鐘":"钟","媽":"妈","講":"讲","話":"话","買":"买","賣":"卖","學":"学","識":"识","寫":"写","細":"细","靚":"靓","貴":"贵","舊":"旧","長":"长","緊":"紧","過":"过","喎":"㖞","囉":"啰"};
