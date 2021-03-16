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
						new CustomEvent("animation", {
							detail: { state: `${this.target.id}`, target: this.target },
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

class SelectAnimation {
	constructor(target) {
		this.target = target;
		this.clicked = false;
		this.hasRun = false;
		this.timeline = this.generateTimeline(target);
		this.registerHandlers(target);
	}

	generateTimeline(target) {
		const animationTargets = {
			from: {
				ease: "circ.out",
				duration: 1,
			},
			to: {
				css: { scale: 1.5 },
			},
		};
		return gsap.timeline().to(target, animationTargets.to).paused(true);
	}

	registerHandlers(target) {
		target.addEventListener("click", (e) => {
			this.clicked = !this.clicked;
			if (this.clicked) {
				e.target.src = "/kite2.png";
				// unpause if it hasn't run before, else play the animation
				!this.hasRun ? this.timeline.paused(false) : this.timeline.play();
			} else {
				e.target.src = "/kite.png";
				this.timeline.reverse();
			}
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

		return (
			gsap
				.timeline()
				// .from(target, animationTargets.from)
				.to(target, animationTargets.to)
				.paused(true)
		);
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

	registerNode(node) {
		this.nodes.push(node);
		node.setAttribute("id", `node${this.nodes.length}`);
		node.addEventListener("click", (e) => {
			// the node ID is named like "node1" so we need to remove "node" from that string to to just get "1"
			const nodeID = e.target.id;
			console.log(`clicked ${nodeID}`);
			this.currentPattern.push(parseInt(nodeID.substring(4)));
			this.checkPattern();
		});
	}

	checkPattern() {
		const key = this.currentPattern.join("");
		if (this.patterns[key] != undefined) {
			console.log("its a match!");
			const nodes = document.querySelectorAll(".image_wrapper");
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
	const animationEmitter = new AnimationEmitter();
	const images = document.querySelectorAll(".kite");
	const outros = [];
	for (let i = 0; i < images.length; i++) {
		const target = images[i];
		const intro = new IntroAnimation(target, animationEmitter);
		// outros.push(new OutroAnimation(target));
		intro.play();
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

	const patternManager = new PatternManager();
	patternManager.registerPattern({ 123: "/test.html" });

	for (const target of images) {
		patternManager.registerNode(target);
	}

	// an example of the animation emitter doing something every time a kite finishes animating
	animationEmitter.addEventListener("animation", (e) => {
		const interactive = new SelectAnimation(e.detail.target);
	});
};

window.addEventListener("load", main);
