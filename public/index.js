const genFloat = (min, max) => Math.random() * (max - min) + min;

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

// Decided i didn't like this
const bounceEffect = (images, target) => {
	// const dur = genFloat(2, 2.5);
	const dur = 1.25;
	// const dur = genFloat(0.1, 0.5);
	const audio = new Audio("gong.wav");
	// const bounceEffect = new TimelineMax({ repeat: -1 });
	const bounceEffect = new TimelineMax();
	bounceEffect
		.to(target, { y: "-=20", ease: Sine.easeInOut, duration: dur })
		.to(target, { y: "+=40", ease: Sine.easeInOut, duration: dur })
		.to(target, { y: "-=20", ease: Sine.easeInOut, duration: dur });
};

class IntroAnimation {
	constructor(target) {
		this.introTimeline = this.generateIntroTimeline(target);
		this.hoverTimeline = this.generateHoverTimeline(target);
		this.paused = false;
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
					console.log("done");
				},
			},
		};

		return gsap
			.timeline()
			.from(target, animationTargets.from)
			.to(target, animationTargets.to)
			.paused(true);
	}

	// when mousing over bounce the target up
	generateHoverTimeline(target) {
		const animationTargets = {
			to: {
				y: "-=25",
				duration: 0.3,
				ease: "power4.out",
			},
		};
		const hoverEffect = gsap.to(target, animationTargets.to).paused(true);

		target.addEventListener("mousemove", (e) => {
			// animation is a bit janky when the intro timeline hasn't finished
			// this just checks that its mostly completed to avoid any weird tween stuff
			// for more info read the mouseleave comments which is also required to fix this bug
			if (this.introTimeline.progress() > 0.8 && !this.paused) {
				hoverEffect.play();
				this.paused = false;
				e.target.src = "/kite2.png";
			}
		});

		target.addEventListener("click", () => {
			// pause the animation. Else unpause (reverse) it
			if (this.paused == false) {
				hoverEffect.paused(true);
				this.paused = true;
			} else {
				hoverEffect.reverse();
				this.paused = false;
			}
		});

		target.addEventListener("mouseleave", (e) => {
			// animation is a bit janky when the intro timeline hasn't finished
			// a bug happens when you mouseenter and mouseleave the animating element while its completing its introTimeline
			// this is because the mousemove hasn't has a change to hover the element up, and now the reverse() function moves it down (so its out of place)
			// this just checks that the introTimeline has finished before reversing the animation which should stop the image being left in a weird position
			if (this.paused == false && this.introTimeline.progress() == 1) {
				hoverEffect.reverse();
				e.target.src = "/kite.png";
			}
		});
	}

	play() {
		this.introTimeline.paused(false);
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
	const images = document.querySelectorAll(".image_wrapper");
	const outros = [];
	for (let i = 0; i < images.length; i++) {
		const target = images[i];
		const intro = new IntroAnimation(target);
		// outros.push(new OutroAnimation(target));
		intro.play();
	}

	const patterns = await (
		await fetch("/combinations.json", {
			method: "GET",
		})
	).json();

	const patternManager = new PatternManager();
	patternManager.registerPattern({ 123: "/test.html" });

	for (const target of images) {
		patternManager.registerNode(target);
	}

	// for (const pattern of patterns) {
	// patternManager.registerPattern(pattern);
	// }
};

window.addEventListener("load", main);
