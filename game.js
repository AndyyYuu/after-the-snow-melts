(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const frame = document.querySelector(".game-frame");
  const titleScreen = document.querySelector("#title-screen");
  const startButton = document.querySelector("#start-button");
  const hud = document.querySelector("#hud");
  const chapterName = document.querySelector("#chapter-name");
  const objective = document.querySelector("#objective");
  const fragmentCount = document.querySelector("#fragment-count");
  const interactionPrompt = document.querySelector("#interaction-prompt");
  const interactionLabel = document.querySelector("#interaction-label");
  const dialogue = document.querySelector("#dialogue");
  const speaker = document.querySelector("#speaker");
  const dialogueText = document.querySelector("#dialogue-text");
  const transitionLayer = document.querySelector("#transition");
  const journal = document.querySelector("#journal");
  const fragmentList = document.querySelector("#fragment-list");
  const journalButton = document.querySelector("#journal-button");
  const journalClose = document.querySelector("#journal-close");
  const ending = document.querySelector("#ending");
  const restartButton = document.querySelector("#restart-button");
  const query = new URLSearchParams(window.location.search);

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const GRID = 32;
  const images = {};
  const imageSources = {
    station: "assets/station.png",
    rain: "assets/rain-town.png",
    flowers: "assets/blue-valley.png",
    festival: "assets/festival.png",
    campfire: "assets/campfire.png",
    workshop: "assets/watchshop.png",
    deathbed: "assets/last-meeting.png",
    final: "assets/final-platform.png",
  };

  const fragments = [
    {
      title: "偏向她的伞",
      text: "雨伞没有坏。莱恩只是把能遮雨的那一半留给了她。",
    },
    {
      title: "没有必要的绕路",
      text: "他多走了两个月，只因为她曾随口说想看看蓝色的花。",
    },
    {
      title: "他讨厌的节日",
      text: "他害怕这一天，却还是陪她站在最亮的灯火里。",
    },
    {
      title: "没有说出口的告白",
      text: "那枚戒指最终被熔成齿轮，藏进了她一直带着的怀表。",
    },
    {
      title: "每年修一次的怀表",
      text: "他认真活完了自己的人生，也替迟到的她保存了回来的路。",
    },
    {
      title: "被封印的最后见面",
      text: "她并非没有悲伤，只是那份悲伤来得太快，她只会逃走。",
    },
    {
      title: "迟到三十年的回答",
      text: "记得一个人并不等于回应他。她终于愿意承认自己也曾需要他。",
    },
  ];

  const state = {
    started: false,
    playing: false,
    sceneIndex: 0,
    flags: new Set(),
    fragments: new Set(),
    dialogueOpen: false,
    journalOpen: false,
    transitioning: false,
    currentLines: [],
    currentLine: 0,
    typing: false,
    typeTimer: null,
    fullLine: "",
    dialogueDone: null,
    toast: null,
    lastTime: 0,
  };

  const player = {
    gx: 18,
    gy: 16,
    x: 18 * GRID + GRID / 2,
    y: 16 * GRID + GRID / 2,
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 0,
    direction: "down",
    moving: false,
    moveStart: 0,
    moveDuration: 118,
    step: 0,
  };

  const line = (speakerName, text) => ({ speaker: speakerName, text });

  const scenes = [
    {
      id: "station",
      image: "station",
      chapter: "序章 · 白栎车站",
      objective: "去候车室门口找诺娅",
      start: [18, 16],
      bounds: [4, 32, 5, 19],
      snow: true,
      avatar: "miro",
      hotspots: [
        {
          id: "noa",
          cell: [7, 9],
          label: "与诺娅交谈",
          lines: [
            line("诺娅", "你比祖父预计的……晚了三十年。"),
            line("弥洛", "三十年不算很久。北境的苔藓打一次盹，也需要二十年。"),
            line("诺娅", "对你不久。对他，是余下的一生。"),
            line("诺娅", "祖父让我把这块怀表交给你。背面还刻着一句话。"),
            line("弥洛", "“如果她回来了，就告诉她——我没有等错。”"),
            line("弥洛", "他还是喜欢说一些让人听不懂的话。"),
            line("诺娅", "那就去问那座钟吧。祖父说，它记得你们走过的路。"),
          ],
          onDone: () => {
            state.flags.add("metNoa");
            setObjective("调查站台中央停摆的大钟");
          },
        },
        {
          id: "umbrella",
          cell: [22, 9],
          label: "查看旧雨伞",
          optional: true,
          lines: [
            line("弥洛", "伞骨向左弯了。三十年前就是这样。"),
            line("诺娅", "祖父却一直说，它没有坏。"),
          ],
        },
        {
          id: "clock",
          cell: [15, 8],
          label: "触碰停摆的大钟",
          condition: () => state.flags.has("metNoa"),
          lockedLines: [line("弥洛", "怀表在发热。诺娅或许知道原因。")],
          lines: [
            line("弥洛", "怀表内部有七个不属于普通机械的空位。"),
            line("诺娅", "祖父每年都会修它一次。直到去世前，他还在等它重新走动。"),
            line("弥洛", "不是钟在呼唤怀表……是记忆。"),
            line("旁白", "秒针向后跳了一格。雪夜被一场三十年前的雨覆盖。"),
          ],
          onDone: () => goToScene(1),
        },
      ],
    },
    {
      id: "rain",
      image: "rain",
      chapter: "第一章 · 偏向她的伞",
      objective: "靠近共撑雨伞的两个人",
      start: [7, 17],
      bounds: [3, 35, 7, 19],
      rain: true,
      avatar: "miro",
      hotspots: [
        {
          id: "coat",
          cell: [29, 8],
          label: "查看壁炉旁的外套",
          optional: true,
          lines: [
            line("弥洛", "两件外套。只有绿色的那件仍在滴水。"),
            line("弥洛", "……我那晚从没问过他为什么发烧。"),
          ],
        },
        {
          id: "umbrella-memory",
          cell: [19, 13],
          label: "进入雨中的记忆",
          lines: [
            line("过去的弥洛", "伞坏了吗？它明显偏向左边。"),
            line("过去的莱恩", "没坏。是我站歪了。"),
            line("过去的弥洛", "那你的平衡感需要练习。"),
            line("现在的弥洛", "我居然相信了。"),
            line("莱恩的回声", "你相信就好。至少那天你没有淋雨。"),
          ],
          fragment: 0,
          onDone: () => goToScene(2),
        },
      ],
    },
    {
      id: "flowers",
      image: "flowers",
      chapter: "第二章 · 没有必要的绕路",
      objective: "调查山谷中的蓝色花朵",
      start: [31, 17],
      bounds: [3, 35, 5, 19],
      avatar: "miro",
      hotspots: [
        {
          id: "blue-flower",
          cell: [12, 14],
          label: "调查蓝色花朵",
          lines: [
            line("弥洛", "北境星瓣花。花期只有三天。"),
            line("弥洛", "从原来的路线到这里，需要多走两个月。"),
            line("弥洛", "莱恩说过，这是地图测绘失误。"),
            line("弥洛", "……他的地图从来没有错过。"),
          ],
          onDone: () => {
            state.flags.add("flowerKnown");
            setObjective("走到莱恩当年站立的位置");
          },
        },
        {
          id: "ryan-view",
          cell: [17, 9],
          label: "站在莱恩的位置",
          condition: () => state.flags.has("flowerKnown"),
          lockedLines: [line("弥洛", "这条路很长。先看看他究竟想让我看什么。")],
          lines: [
            line("过去的弥洛", "实物和书上的插图差不多。"),
            line("过去的莱恩", "只有这个感想？"),
            line("过去的弥洛", "还应该有什么感想？"),
            line("过去的莱恩", "没有。你记得就行。"),
            line("现在的弥洛", "他没有在看花。"),
            line("现在的弥洛", "他一直在看我。"),
          ],
          fragment: 1,
          onDone: () => goToScene(3),
        },
      ],
    },
    {
      id: "festival",
      image: "festival",
      chapter: "第三章 · 他讨厌的节日",
      objective: "寻找广场角落被灯火避开的地方",
      start: [33, 18],
      bounds: [4, 35, 5, 19],
      snow: true,
      avatar: "miro",
      hotspots: [
        {
          id: "memorial",
          cell: [31, 6],
          label: "查看纪念碑",
          lines: [
            line("弥洛", "灯火节事故遇难者名录。"),
            line("弥洛", "莱恩的父亲……也在上面。"),
            line("弥洛", "所以他不是不喜欢人群。他害怕的是这一天。"),
          ],
          onDone: () => {
            state.flags.add("memorialKnown");
            setObjective("回到广场中央的飞灯旁");
          },
        },
        {
          id: "lantern",
          cell: [19, 12],
          label: "触碰修好的飞灯",
          condition: () => state.flags.has("memorialKnown"),
          lockedLines: [line("弥洛", "我记得这盏灯，却不记得广场角落的那块碑。")],
          lines: [
            line("过去的弥洛", "你不是讨厌灯火节吗？"),
            line("过去的莱恩", "是啊。非常讨厌。"),
            line("过去的弥洛", "那为什么还来？"),
            line("过去的莱恩", "因为你说想看。"),
            line("现在的弥洛", "我当时为什么没有继续问？"),
            line("莱恩的回声", "因为那时候的你，还不会问。"),
          ],
          fragment: 2,
          onDone: () => goToScene(4),
        },
      ],
    },
    {
      id: "campfire",
      image: "campfire",
      chapter: "第四章 · 没有说出口的告白",
      objective: "调查莱恩藏在营火旁的东西",
      start: [20, 18],
      bounds: [5, 34, 7, 19],
      snow: true,
      avatar: "miro",
      hotspots: [
        {
          id: "ring",
          cell: [25, 12],
          label: "拾起变形的金属环",
          lines: [
            line("弥洛", "银、黄铜和一小片记忆结晶。原本应该是一枚戒指。"),
            line("弥洛", "后来它被熔掉，做成了怀表里的齿轮。"),
          ],
          onDone: () => {
            state.flags.add("ringKnown");
            setObjective("听完营火旁未说出口的话");
          },
        },
        {
          id: "confession",
          cell: [24, 10],
          label: "靠近莱恩",
          condition: () => state.flags.has("ringKnown"),
          lockedLines: [line("弥洛", "营火旁有什么东西在反光。")],
          lines: [
            line("过去的莱恩", "如果有人希望一直和你旅行，你会怎么回答？"),
            line("过去的弥洛", "不可能。人类会衰老、受伤，然后死去。"),
            line("过去的莱恩", "也是。"),
            line("现在的弥洛", "原来……他喜欢我。"),
            line("诺娅的回声", "不。你只是终于发现他喜欢你。"),
            line("诺娅的回声", "这和理解他，是两回事。"),
          ],
          fragment: 3,
          onDone: () => goToScene(5),
        },
      ],
    },
    {
      id: "workshop",
      image: "workshop",
      chapter: "第五章 · 被留下的三十年",
      objective: "这一次，你将沿着莱恩的时间行走",
      start: [20, 18],
      bounds: [4, 35, 5, 19],
      avatar: "ryan",
      hotspots: [
        {
          id: "cups",
          cell: [23, 11],
          label: "查看两边的杯子",
          lines: [
            line("旁白", "年轻时，桌上有两只杯子。后来，只有一只被使用。"),
            line("老年莱恩", "空着也好。至少能提醒我，以前有人不喜欢喝酒。"),
          ],
          onDone: () => workshopClue("workshopCups"),
        },
        {
          id: "calendars",
          cell: [32, 8],
          label: "翻看堆叠的日历",
          lines: [
            line("旁白", "莱恩没有停在那场分别里。"),
            line("旁白", "他结婚、失去妻子，收养战争中的孩子，成为一名修表匠。"),
            line("旁白", "他认真地爱过别人，也认真地活完了自己的生活。"),
          ],
          onDone: () => workshopClue("workshopLife"),
        },
        {
          id: "watch-record",
          cell: [16, 11],
          label: "阅读怀表维修记录",
          lines: [
            line("维修记录", "白栎历一四七年：更换发条。她没有回来。"),
            line("维修记录", "白栎历一五九年：校准齿轮。她大概还不明白。"),
            line("维修记录", "白栎历一七六年：手已经不稳了。再修最后一次。"),
            line("莱恩的手记", "她不是不会难过。她只是会在很久以后，独自难过。"),
          ],
          onDone: () => workshopClue("workshopWatch"),
        },
      ],
    },
    {
      id: "deathbed",
      image: "deathbed",
      chapter: "第六章 · 被封印的最后一次见面",
      objective: "走到床边，面对被自己藏起来的记忆",
      start: [18, 18],
      bounds: [5, 35, 5, 19],
      avatar: "miro",
      hotspots: [
        {
          id: "green-coat",
          cell: [17, 7],
          label: "触碰绿色旧外套",
          optional: true,
          lines: [
            line("弥洛", "这件外套补过十七次。最后一次针脚很乱。"),
            line("弥洛", "我却一直记得它年轻时的样子。"),
          ],
        },
        {
          id: "last-meeting",
          cell: [31, 10],
          label: "握住莱恩的手",
          lines: [
            line("老年莱恩", "你见过年轻时的我吗？"),
            line("过去的弥洛", "见过。我们一起旅行过十一年零四个月。"),
            line("老年莱恩", "那她过得好吗？"),
            line("过去的弥洛", "她没有受伤，也没有生病。"),
            line("老年莱恩", "那就好。"),
            line("老年莱恩", "弥洛，我这一生最幸运的事，是你曾经需要我。"),
            line("过去的弥洛", "我不需要任何人。我可以独自使用传送魔法。"),
            line("旁白", "莱恩没有反驳。那只握着她的手，慢慢失去了温度。"),
            line("现在的弥洛", "我不是忘记了。"),
            line("现在的弥洛", "是我第一次感到那么痛，所以把这段记忆封印了。"),
          ],
          fragment: 5,
          onDone: () => goToScene(7),
        },
      ],
    },
    {
      id: "final",
      image: "final",
      chapter: "终章 · 雪融化以后",
      objective: "把迟到了三十年的回答告诉莱恩",
      start: [18, 18],
      bounds: [4, 32, 5, 19],
      snow: true,
      avatar: "miro",
      hotspots: [
        {
          id: "last-umbrella",
          cell: [22, 9],
          label: "再次查看旧雨伞",
          optional: true,
          lines: [
            line("弥洛", "不是伞坏了。"),
            line("弥洛", "他只是一直站在雨里。"),
          ],
        },
        {
          id: "last-flower",
          cell: [32, 12],
          label: "查看反季节的蓝花",
          optional: true,
          lines: [
            line("弥洛", "这一次，我会认真看。"),
          ],
        },
        {
          id: "answer",
          cell: [20, 13],
          label: "回应莱恩",
          lines: [
            line("弥洛", "莱恩，我现在明白了。"),
            line("弥洛", "我不是不需要你。"),
            line("弥洛", "我只是一直以为，只要记得一个人，就不算失去他。"),
            line("弥洛", "可是记忆不会替我回答你。"),
            line("弥洛", "对不起。我来得太晚了。"),
            line("怀表中的莱恩", "如果你听到了这个，说明你总算想明白了。"),
            line("怀表中的莱恩", "别摆出那副世界末日的表情。"),
            line("怀表中的莱恩", "我喜欢过你。不是为了让你愧疚，也不是为了等你还给我什么。"),
            line("怀表中的莱恩", "只是因为和你一起走过的那段路，我很幸福。"),
            line("怀表中的莱恩", "所以，你也继续走吧。"),
            line("旁白", "停走三十年的怀表重新发出滴答声。大钟的秒针，也向前移动了一格。"),
            line("诺娅", "接下来去哪里？"),
            line("弥洛", "去看一种蓝色的花。以前有人带我看过，但当时我没有认真看。"),
            line("诺娅", "这次呢？"),
            line("弥洛", "这次，我会想念他。"),
          ],
          fragment: 6,
          onDone: showEnding,
        },
      ],
    },
  ];

  const snow = Array.from({ length: 82 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    speed: 12 + Math.random() * 24,
    drift: 3 + Math.random() * 8,
    size: Math.random() > 0.75 ? 3 : 2,
  }));

  const rain = Array.from({ length: 86 }, () => ({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    speed: 250 + Math.random() * 180,
    length: 7 + Math.random() * 10,
  }));

  function preloadImages() {
    startButton.disabled = true;
    startButton.textContent = "载入场景…";
    const jobs = Object.entries(imageSources).map(([key, src]) => new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        images[key] = image;
        resolve();
      };
      image.onerror = () => {
        console.warn(`背景载入失败：${src}`);
        resolve();
      };
      image.src = src;
    }));

    return Promise.all(jobs).then(() => {
      startButton.disabled = false;
      startButton.textContent = "开始回忆";
    });
  }

  function resetGame() {
    state.sceneIndex = 0;
    state.flags.clear();
    state.fragments.clear();
    state.dialogueOpen = false;
    state.journalOpen = false;
    state.transitioning = false;
    state.toast = null;
    state.playing = true;
    dialogue.classList.add("is-hidden");
    journal.classList.add("is-hidden");
    ending.classList.add("is-hidden");
    hud.classList.remove("is-hidden");
    frame.classList.remove("dialogue-open");
    loadScene(0);
    renderJournal();
  }

  function startGame() {
    titleScreen.classList.add("is-hidden");
    state.started = true;
    resetGame();
    canvas.focus();
    showDialogue([
      line("旁白", "莱恩去世后的第三十年，弥洛回到了白栎车站。"),
      line("旁白", "她以为自己只是来取走一件旧物。"),
      line("旁白", "她还不知道，有些感情要在失去很久以后，才终于抵达。"),
    ]);
  }

  function loadScene(index) {
    const scene = scenes[index];
    state.sceneIndex = index;
    player.gx = scene.start[0];
    player.gy = scene.start[1];
    player.x = player.gx * GRID + GRID / 2;
    player.y = player.gy * GRID + GRID / 2;
    player.moving = false;
    player.direction = "down";
    chapterName.textContent = scene.chapter;
    setObjective(scene.objective);
  }

  function goToScene(index) {
    if (state.transitioning) return;
    state.transitioning = true;
    interactionPrompt.classList.add("is-hidden");
    transitionLayer.classList.remove("is-active");
    void transitionLayer.offsetWidth;
    transitionLayer.classList.add("is-active");
    playShift();

    window.setTimeout(() => loadScene(index), 470);
    window.setTimeout(() => {
      state.transitioning = false;
      transitionLayer.classList.remove("is-active");
      canvas.focus();
    }, 1180);
  }

  function setObjective(text) {
    objective.textContent = text;
  }

  function workshopClue(flag) {
    state.flags.add(flag);
    const count = ["workshopCups", "workshopLife", "workshopWatch"]
      .filter((key) => state.flags.has(key)).length;
    setObjective(`查看莱恩留下的生活痕迹（${count}/3）`);
    if (count === 3 && !state.flags.has("workshopComplete")) {
      state.flags.add("workshopComplete");
      collectFragment(4);
      window.setTimeout(() => {
        showDialogue([
          line("老年莱恩", "她不是不会难过。她只是会在很久以后，独自难过。"),
          line("旁白", "怀表不是一封索要答案的情书。"),
          line("旁白", "它只是莱恩替未来的弥洛留下一条路，让她不必独自承受迟到的悲伤。"),
        ], () => goToScene(6));
      }, 650);
    }
  }

  function hotspotKey(hotspot) {
    return `hotspot:${scenes[state.sceneIndex].id}:${hotspot.id}`;
  }

  function nearestHotspot() {
    if (!state.playing || state.dialogueOpen || state.journalOpen || state.transitioning || player.moving) {
      return null;
    }
    const scene = scenes[state.sceneIndex];
    let nearest = null;
    let nearestDistance = Infinity;
    for (const hotspot of scene.hotspots) {
      const dx = hotspot.cell[0] - player.gx;
      const dy = hotspot.cell[1] - player.gy;
      const distance = Math.abs(dx) + Math.abs(dy);
      if (distance <= 2 && distance < nearestDistance) {
        nearest = hotspot;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function interact() {
    if (state.dialogueOpen) {
      advanceDialogue();
      return;
    }
    if (!state.playing || state.journalOpen || state.transitioning) return;
    const hotspot = nearestHotspot();
    if (!hotspot) return;
    const used = state.flags.has(hotspotKey(hotspot));
    if (used) {
      if (hotspot.optional) return;
      showDialogue(hotspot.repeatLines || [line("弥洛", "这段记忆已经不会再改变了。")]);
      return;
    }
    if (hotspot.condition && !hotspot.condition()) {
      showDialogue(hotspot.lockedLines || [line("弥洛", "现在还无法读懂这里的记忆。")]);
      return;
    }

    showDialogue(hotspot.lines, () => {
      state.flags.add(hotspotKey(hotspot));
      if (typeof hotspot.fragment === "number") collectFragment(hotspot.fragment);
      if (hotspot.onDone) hotspot.onDone();
    });
  }

  function showDialogue(lines, done) {
    if (!lines || !lines.length) {
      done?.();
      return;
    }
    state.dialogueOpen = true;
    state.currentLines = lines;
    state.currentLine = 0;
    state.dialogueDone = done || null;
    dialogue.classList.remove("is-hidden");
    interactionPrompt.classList.add("is-hidden");
    frame.classList.add("dialogue-open");
    setDialogueLine(lines[0]);
  }

  function setDialogueLine(entry) {
    window.clearInterval(state.typeTimer);
    state.typing = true;
    state.fullLine = entry.text;
    speaker.textContent = entry.speaker;
    dialogueText.textContent = "";
    const characters = Array.from(entry.text);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dialogueText.textContent = entry.text;
      state.typing = false;
      return;
    }
    let index = 0;
    state.typeTimer = window.setInterval(() => {
      dialogueText.textContent += characters[index] || "";
      index += 1;
      if (index >= characters.length) {
        window.clearInterval(state.typeTimer);
        state.typing = false;
      }
    }, 26);
  }

  function advanceDialogue() {
    if (!state.dialogueOpen) return;
    if (state.typing) {
      window.clearInterval(state.typeTimer);
      dialogueText.textContent = state.fullLine;
      state.typing = false;
      return;
    }
    state.currentLine += 1;
    if (state.currentLine < state.currentLines.length) {
      setDialogueLine(state.currentLines[state.currentLine]);
      return;
    }
    closeDialogue();
  }

  function closeDialogue() {
    window.clearInterval(state.typeTimer);
    state.dialogueOpen = false;
    dialogue.classList.add("is-hidden");
    frame.classList.remove("dialogue-open");
    const done = state.dialogueDone;
    state.dialogueDone = null;
    done?.();
    canvas.focus();
  }

  function collectFragment(index) {
    if (state.fragments.has(index)) return;
    state.fragments.add(index);
    fragmentCount.textContent = String(state.fragments.size);
    state.toast = {
      title: fragments[index].title,
      text: fragments[index].text,
      start: performance.now(),
      duration: 4200,
    };
    playChime();
    renderJournal();
  }

  function renderJournal() {
    fragmentList.innerHTML = "";
    fragments.forEach((fragment, index) => {
      const item = document.createElement("li");
      const unlocked = state.fragments.has(index);
      if (!unlocked) item.className = "is-locked";
      const title = document.createElement("strong");
      const description = document.createElement("small");
      title.textContent = unlocked ? fragment.title : "尚未抵达的记忆";
      description.textContent = unlocked ? fragment.text : "……";
      item.append(title, description);
      fragmentList.appendChild(item);
    });
  }

  function toggleJournal(force) {
    if (!state.started || state.dialogueOpen || state.transitioning) return;
    state.journalOpen = typeof force === "boolean" ? force : !state.journalOpen;
    journal.classList.toggle("is-hidden", !state.journalOpen);
    interactionPrompt.classList.add("is-hidden");
    if (!state.journalOpen) canvas.focus();
  }

  function showEnding() {
    state.playing = false;
    interactionPrompt.classList.add("is-hidden");
    hud.classList.add("is-hidden");
    window.setTimeout(() => ending.classList.remove("is-hidden"), 900);
  }

  function restart() {
    ending.classList.add("is-hidden");
    resetGame();
    showDialogue([
      line("旁白", "秒针再次回到雪夜。"),
      line("旁白", "这一次，你已经知道该去寻找什么。"),
    ]);
  }

  function attemptMove(dx, dy) {
    if (!state.playing || state.dialogueOpen || state.journalOpen || state.transitioning || player.moving) return;
    const scene = scenes[state.sceneIndex];
    const [minX, maxX, minY, maxY] = scene.bounds;
    const nextX = Math.max(minX, Math.min(maxX, player.gx + dx));
    const nextY = Math.max(minY, Math.min(maxY, player.gy + dy));
    if (nextX === player.gx && nextY === player.gy) return;
    player.direction = dx < 0 ? "left" : dx > 0 ? "right" : dy < 0 ? "up" : "down";
    player.fromX = player.x;
    player.fromY = player.y;
    player.gx = nextX;
    player.gy = nextY;
    player.toX = nextX * GRID + GRID / 2;
    player.toY = nextY * GRID + GRID / 2;
    player.moveStart = performance.now();
    player.moving = true;
    player.step += 1;
  }

  function updatePlayer(time) {
    if (!player.moving) return;
    const progress = Math.min(1, (time - player.moveStart) / player.moveDuration);
    const eased = 1 - Math.pow(1 - progress, 3);
    player.x = player.fromX + (player.toX - player.fromX) * eased;
    player.y = player.fromY + (player.toY - player.fromY) * eased;
    if (progress >= 1) {
      player.x = player.toX;
      player.y = player.toY;
      player.moving = false;
    }
  }

  function drawBackground(scene) {
    const image = images[scene.image];
    if (image) {
      ctx.drawImage(image, 0, 0, WIDTH, HEIGHT);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      gradient.addColorStop(0, "#263652");
      gradient.addColorStop(1, "#101927");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    ctx.fillStyle = "rgba(7, 14, 25, 0.08)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  function drawGrid(scene) {
    const [minX, maxX, minY, maxY] = scene.bounds;
    const left = minX * GRID;
    const top = minY * GRID;
    const right = (maxX + 1) * GRID;
    const bottom = (maxY + 1) * GRID;
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, right - left, bottom - top);
    ctx.clip();
    ctx.lineWidth = 1;
    ctx.strokeStyle = scene.id === "flowers"
      ? "rgba(115, 213, 209, 0.12)"
      : "rgba(224, 232, 238, 0.105)";
    ctx.beginPath();
    for (let x = left; x <= right; x += GRID) {
      ctx.moveTo(Math.round(x) + 0.5, top);
      ctx.lineTo(Math.round(x) + 0.5, bottom);
    }
    for (let y = top; y <= bottom; y += GRID) {
      ctx.moveTo(left, Math.round(y) + 0.5);
      ctx.lineTo(right, Math.round(y) + 0.5);
    }
    ctx.stroke();

    ctx.fillStyle = "rgba(230, 215, 173, 0.16)";
    for (let gx = minX; gx <= maxX; gx += 4) {
      for (let gy = minY; gy <= maxY; gy += 4) {
        ctx.fillRect(gx * GRID, gy * GRID, 2, 2);
      }
    }
    ctx.restore();
  }

  function drawHotspots(scene, time) {
    const pulse = 0.58 + Math.sin(time / 330) * 0.22;
    for (const hotspot of scene.hotspots) {
      if (state.flags.has(hotspotKey(hotspot)) && hotspot.optional) continue;
      const x = hotspot.cell[0] * GRID + GRID / 2;
      const y = hotspot.cell[1] * GRID + GRID / 2;
      const available = !hotspot.condition || hotspot.condition();
      ctx.save();
      ctx.globalAlpha = available ? pulse : 0.3;
      ctx.translate(Math.round(x), Math.round(y - 20));
      ctx.fillStyle = available ? "#f0c978" : "#93a0ad";
      ctx.fillRect(-2, -8, 4, 4);
      ctx.fillRect(-6, -4, 12, 4);
      ctx.fillRect(-2, 0, 4, 4);
      ctx.fillStyle = available ? "#fff1b7" : "#c8d0d7";
      ctx.fillRect(-2, -4, 4, 4);
      ctx.restore();
    }
  }

  function drawMiro(x, y, time) {
    const bob = player.moving ? Math.round(Math.sin((time - player.moveStart) / 18) * 1.4) : 0;
    const flip = player.direction === "left" ? -1 : 1;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y + bob));
    ctx.scale(flip, 1);
    ctx.shadowColor = "rgba(115, 213, 209, 0.9)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "rgba(8, 13, 22, 0.48)";
    ctx.beginPath();
    ctx.ellipse(0, 15, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#d9e1e7";
    ctx.fillRect(-6, -10, 12, 13);
    ctx.fillRect(-8, -6, 4, 15);
    ctx.fillRect(5, -5, 4, 14);
    ctx.fillStyle = "#e9d7bb";
    ctx.fillRect(-4, -9, 8, 7);
    ctx.fillStyle = "#1b2942";
    ctx.fillRect(-7, 0, 14, 12);
    ctx.fillRect(-9, 7, 18, 7);
    ctx.fillStyle = "#d8cfb9";
    ctx.fillRect(-5, 1, 10, 3);
    ctx.fillRect(-4, 11, 8, 4);
    ctx.fillStyle = "#402f28";
    ctx.fillRect(-7, 14, 5, 3);
    ctx.fillRect(2, 14, 5, 3);
    ctx.fillStyle = "#17233a";
    ctx.fillRect(-11, -15, 22, 4);
    ctx.fillRect(-6, -20, 13, 5);
    ctx.fillRect(-3, -24, 8, 5);
    ctx.fillStyle = "#bd9753";
    ctx.fillRect(5, 3, 4, 6);
    ctx.restore();
  }

  function drawRyan(x, y, time) {
    const bob = player.moving ? Math.round(Math.sin((time - player.moveStart) / 18) * 1.4) : 0;
    const flip = player.direction === "left" ? -1 : 1;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y + bob));
    ctx.scale(flip, 1);
    ctx.shadowColor = "rgba(240, 201, 120, 0.78)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "rgba(8, 13, 22, 0.48)";
    ctx.beginPath();
    ctx.ellipse(0, 15, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#3d2d28";
    ctx.fillRect(-6, -15, 12, 6);
    ctx.fillRect(-8, -12, 4, 6);
    ctx.fillStyle = "#e3c4a3";
    ctx.fillRect(-5, -10, 10, 8);
    ctx.fillStyle = "#a88457";
    ctx.fillRect(-7, -2, 14, 4);
    ctx.fillStyle = "#33483c";
    ctx.fillRect(-8, 2, 16, 12);
    ctx.fillStyle = "#252b2b";
    ctx.fillRect(-6, 13, 5, 4);
    ctx.fillRect(2, 13, 5, 4);
    ctx.fillStyle = "#674b32";
    ctx.fillRect(6, 4, 4, 7);
    ctx.restore();
  }

  function drawWeather(scene, dt) {
    if (scene.snow) {
      ctx.fillStyle = "rgba(236, 244, 248, 0.72)";
      snow.forEach((flake) => {
        flake.y += flake.speed * dt;
        flake.x += flake.drift * dt;
        if (flake.y > HEIGHT) {
          flake.y = -4;
          flake.x = Math.random() * WIDTH;
        }
        if (flake.x > WIDTH) flake.x = -4;
        ctx.fillRect(Math.round(flake.x), Math.round(flake.y), flake.size, flake.size);
      });
    }
    if (scene.rain) {
      ctx.strokeStyle = "rgba(177, 206, 224, 0.34)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      rain.forEach((drop) => {
        drop.y += drop.speed * dt;
        drop.x -= drop.speed * 0.14 * dt;
        if (drop.y > HEIGHT) {
          drop.y = -drop.length;
          drop.x = Math.random() * WIDTH;
        }
        if (drop.x < 0) drop.x = WIDTH;
        ctx.moveTo(Math.round(drop.x), Math.round(drop.y));
        ctx.lineTo(Math.round(drop.x - 3), Math.round(drop.y + drop.length));
      });
      ctx.stroke();
    }
  }

  function drawToast(time) {
    if (!state.toast) return;
    const age = time - state.toast.start;
    if (age > state.toast.duration) {
      state.toast = null;
      return;
    }
    const fadeIn = Math.min(1, age / 300);
    const fadeOut = Math.min(1, (state.toast.duration - age) / 550);
    const alpha = Math.min(fadeIn, fadeOut);
    ctx.save();
    ctx.globalAlpha = alpha;
    const w = 520;
    const h = 78;
    const x = WIDTH / 2 - w / 2;
    const y = 92;
    ctx.fillStyle = "rgba(8, 18, 33, 0.94)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#e6d7ad";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = "#f0c978";
    ctx.font = "700 17px 'Microsoft YaHei', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`获得记忆碎片 · ${state.toast.title}`, WIDTH / 2, y + 29);
    ctx.fillStyle = "#cbd5de";
    ctx.font = "13px 'Microsoft YaHei', monospace";
    ctx.fillText(state.toast.text, WIDTH / 2, y + 55);
    ctx.restore();
  }

  function render(time = 0) {
    const dt = Math.min(0.05, (time - state.lastTime) / 1000 || 0);
    state.lastTime = time;
    const scene = scenes[state.sceneIndex];
    updatePlayer(time);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground(scene);
    drawGrid(scene);
    drawHotspots(scene, time);
    if (state.started && state.playing) {
      if (scene.avatar === "ryan") drawRyan(player.x, player.y, time);
      else drawMiro(player.x, player.y, time);
    }
    drawWeather(scene, dt);
    drawToast(time);

    const nearby = nearestHotspot();
    if (nearby) {
      interactionLabel.textContent = nearby.label;
      interactionPrompt.classList.remove("is-hidden");
    } else {
      interactionPrompt.classList.add("is-hidden");
    }
    requestAnimationFrame(render);
  }

  let audioContext = null;
  function ensureAudio() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
  }

  function playTone(frequency, start, duration, gain = 0.025) {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(0, start);
    volume.gain.linearRampToValueAtTime(gain, start + 0.04);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(volume).connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  function playChime() {
    ensureAudio();
    const now = audioContext.currentTime;
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      playTone(frequency, now + index * 0.11, 1.25, 0.022);
    });
  }

  function playShift() {
    ensureAudio();
    const now = audioContext.currentTime;
    playTone(392, now, 0.9, 0.018);
    playTone(523.25, now + 0.13, 1.1, 0.018);
  }

  function handleKey(event) {
    const key = event.key.toLowerCase();
    const handled = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "e", "enter", " ", "j", "escape"];
    if (handled.includes(key)) event.preventDefault();

    if (!state.started) {
      if (key === "enter" && !startButton.disabled) startGame();
      return;
    }
    if (!ending.classList.contains("is-hidden")) {
      if (key === "enter") restart();
      return;
    }
    if (state.journalOpen) {
      if (key === "j" || key === "escape") toggleJournal(false);
      return;
    }
    if (state.dialogueOpen) {
      if (["e", "enter", " "].includes(key)) advanceDialogue();
      return;
    }
    if (key === "j") {
      toggleJournal();
      return;
    }
    if (["e", "enter", " "].includes(key)) {
      interact();
      return;
    }
    if (key === "w" || key === "arrowup") attemptMove(0, -1);
    if (key === "s" || key === "arrowdown") attemptMove(0, 1);
    if (key === "a" || key === "arrowleft") attemptMove(-1, 0);
    if (key === "d" || key === "arrowright") attemptMove(1, 0);
  }

  startButton.addEventListener("click", () => {
    ensureAudio();
    startGame();
  });
  restartButton.addEventListener("click", restart);
  dialogue.addEventListener("click", advanceDialogue);
  journalButton.addEventListener("click", () => toggleJournal(true));
  journalClose.addEventListener("click", () => toggleJournal(false));
  window.addEventListener("keydown", handleKey, { passive: false });

  document.querySelectorAll(".mobile-controls button").forEach((button) => {
    let repeatTimer = null;
    const trigger = () => {
      if (button.dataset.action === "interact") interact();
      if (button.dataset.key === "ArrowUp") attemptMove(0, -1);
      if (button.dataset.key === "ArrowDown") attemptMove(0, 1);
      if (button.dataset.key === "ArrowLeft") attemptMove(-1, 0);
      if (button.dataset.key === "ArrowRight") attemptMove(1, 0);
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      trigger();
      if (button.dataset.key) repeatTimer = window.setInterval(trigger, 145);
    });
    const stop = () => window.clearInterval(repeatTimer);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("pointerleave", stop);
  });

  preloadImages().then(() => {
    if (query.get("qa") === "autostart") startGame();
  });
  renderJournal();
  requestAnimationFrame(render);
})();
