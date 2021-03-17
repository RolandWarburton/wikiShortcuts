const genFloat = (min, max) => Math.random() * (max - min) + min;

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

class AnimationEmitter extends EventTarget {
	constructor(initialState) {
		super();
		this.animationState = initialState;
	}

	dispatchAnimationState(event) {
		this.dispatchEvent(event);
	}
}

class IntroAnimation {
	constructor(target, animationEmitter) {
		this.target = target;
		this.introTimeline = this.generateIntroTimeline(target);
		// this.hoverTimeline = this.generateHoverTimeline(target);
		this.paused = false;
		this.animationEmitter = animationEmitter;
	}

	generateIntroTimeline(target) {
		const animationTargets = {
			from: {
				ease: "circ.out",
				duration: genFloat(0.25, 0.5),
				y: genFloat(50, 80), // vert
				x: genFloat(-40, -80), // horz
				delay: genFloat(0.5, 0.75),
				opacity: 0,
			},
			to: {
				opacity: 1,
				oncomplete: () => {
					this.animationEmitter.dispatchAnimationState(
						new CustomEvent(this.constructor.name, {
							detail: { event: this.className, target: this.target },
						})
					);
				},
			},
		};

		return gsap
			.timeline()
			.from(target, animationTargets.from)
			.to(target, animationTargets.to)
			.paused(true);
	}
	play() {
		this.introTimeline.paused(false);
	}
}

class SelectKiteAnimation {
	constructor(target, animationEmitter) {
		this.target = target;
		this.clicked = false;
		this.hasRun = false;
		this.timeline = this.generateTimeline(target);
		this.animationEmitter = animationEmitter;
	}

	generateTimeline(target) {
		const animationTargets = {
			to: {
				ease: "power2.out",
				duration: 1,
				y: -20,
				x: 20,
				delay: 0,
			},
		};

		return gsap.timeline().to(target, animationTargets.to).paused(true);
	}

	play() {
		this.clicked = !this.clicked;
		if (this.clicked && !this.hasRun) {
			this.target.src = "/kite2.png";
			!this.hasRun ? this.timeline.paused(false) : this.timeline.play();
		} else {
			// ? commented out because we dont want to reverse the animation
			// this.target.src = "/kite.png";
			// this.timeline.reverse();
		}
		this.hasRun = true;
	}
}

class SelectHaloAnimation {
	constructor(target, animationEmitter) {
		this.target = target;
		this.clicked = false;
		this.hasRun = false;
		this.animationEmitter = animationEmitter;
		this.timeline = this.generateTimeline(target);
		this.registerHandlers(target);
	}

	generateTimeline(target) {
		const animationTargets = {
			from: {
				ease: "circ.out",
				duration: 0.25,
				css: { scale: 0.5, opacity: 0 },
			},
			to: {
				// css: { scale: 1.5 },
				css: { opacity: 0 },
			},
		};
		return gsap
			.timeline()
			.from(target, animationTargets.from)
			.to(target, animationTargets.to)
			.paused(true);
	}

	registerHandlers(target) {
		target.addEventListener("click", (e) => {
			this.clicked = !this.clicked;
			if (this.clicked && !this.hasRun) {
				// unpause if it hasn't run before, else play the animation
				!this.hasRun ? this.timeline.paused(false) : this.timeline.play();
			} else {
				// ? commented out because we dont want to reverse the animation
				// no reverse allowed (!this.hasRun check)
				// this.timeline.reverse();
			}
			this.animationEmitter.dispatchAnimationState(
				new CustomEvent(this.constructor.name, { detail: { target: this.target } })
			);
			this.hasRun = true;
		});
	}
}

class OutroAnimation {
	constructor(target, callback) {
		this.outroTimeline = this.generateOutroTimeline(target, callback);
	}

	generateOutroTimeline(target, callback) {
		const animationTargets = {
			from: {
				opacity: 1,
			},
			to: {
				ease: "circ.out",
				duration: 1.5,
				y: genFloat(-50, -80), // vert
				x: genFloat(40, 80), // horz
				opacity: 0,
				onComplete: () => {
					callback();
				},
			},
		};

		return gsap.timeline().to(target, animationTargets.to).paused(true);
	}

	play() {
		this.outroTimeline.paused(false);
	}
}

class PatternManager {
	constructor() {
		this.currentPattern = [];
		this.patterns = {};
		this.nodes = [];
	}

	registerPattern(newPattern) {
		const key = Object.keys(newPattern)[0];
		if (this.patterns[newPattern] == undefined) {
			this.patterns[key] = newPattern[key];
		}
	}

	// Register <div.image> wrapper to apply the "nodeN" ID to
	// The click event is registered to the <div.image> wrapper as well

	registerNode(node) {
		this.nodes.push(node);
		node.setAttribute("id", `node${this.nodes.length}`);
		node.addEventListener("click", (e) => {
			// the node ID is named like "node1" so we need to remove "node" from that string to to just get "1"
			const nodeID = e.target.parentNode.id;
			console.log(`clicked node: ${nodeID}`);
			this.currentPattern.push(parseInt(nodeID.substring(4)));
			this.checkPattern();
		});
	}

	checkPattern() {
		const key = this.currentPattern.join("");
		if (this.patterns[key] != undefined) {
			console.log("its a match!");
			const nodes = document.querySelectorAll(".kite");
			for (const node of nodes) {
				const outro = new OutroAnimation(node, () => {
					window.location.href = this.patterns[key];
				});
				outro.play();
			}
		}
	}
}

const main = async () => {
	// Create the anim emitter as part of the animations events handler system
	const animationEmitter = new AnimationEmitter();

	// Get all the <div.image> wrappers
	const images = document.querySelectorAll(".image");

	// Create an empty shell for the animation pairs (halos and kites)
	const animPairs = {};

	// Create the pattern manager and register an example pattern
	const patternManager = new PatternManager();
	patternManager.registerPattern({ 123: "/test.html" });

	// Register patterns in the pattern manager (assign unique IDs to )
	for (const target of images) {
		patternManager.registerNode(target);
	}

	// play some intro animations!
	for (let i = 0; i < images.length; i++) {
		const kite = images[i].querySelector(".kite");
		const halo = images[i].querySelector(".halo");
		const intro = new IntroAnimation(kite, animationEmitter);
		intro.play();

		// while we are at it, create select animations for the img.kite and img.halo inside div.image to use later
		const haloAnim = new SelectHaloAnimation(halo, animationEmitter);
		const kiteAnim = new SelectKiteAnimation(kite, animationEmitter);

		// populate the animPairs array with the two related animations (halo and kite anim). when was fortress melbourne founded
		// importantly we can recall the kite anim, because the halo anim has an onclick handler for its self
		const imageNodeID = images[i].id;
		animPairs[imageNodeID] = {};
		animPairs[imageNodeID].halo = haloAnim;
		animPairs[imageNodeID].kite = kiteAnim;
	}

	// ? An example of a pattern file being loaded and registered with the pattern manager
	// const patterns = await (
	// 	await fetch("/combinations.json", {
	// 		method: "GET",
	// 	})
	// ).json();
	// for (const pattern of patterns) {
	// patternManager.registerPattern(pattern);
	// }

	// an example of the animation emitter doing something every time a kite finishes animating
	animationEmitter.addEventListener("IntroAnimation", (e) => {
		// do something after the intro animation has played
	});

	// when halo is clicked we trigger the SelectHaloAnimation
	animationEmitter.addEventListener("SelectHaloAnimation", (e) => {
		// when the select animation is playing, also animate the kites
		animPairs[e.detail.target.parentNode.id].kite.play();
	});
};

window.addEventListener("load", main);
