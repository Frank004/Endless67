
// You can write more code here

/* START OF COMPILED CODE */

class LayoutStore extends Phaser.Scene {

	constructor() {
		super("LayoutStore");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	/** @returns {void} */
	editorCreate() {

		// storebg_png
		const storebg_png = this.add.image(0, 0, "store", "storebg.png");
		storebg_png.setOrigin(0, 0);

		// cardbox_common_png
		this.add.image(100, 294, "store", "cardbox common.png");

		// the_vault_store
		const the_vault_store = this.add.image(181, 125, "the-vault-store");
		the_vault_store.scaleX = 0.2;
		the_vault_store.scaleY = 0.2;

		// cardbox_common_png_1
		this.add.image(269, 292, "store", "cardbox common.png");

		// cardbox_common_png_2
		this.add.image(267, 491, "store", "cardbox common.png");

		// cardbox_common_png_3
		this.add.image(99, 490, "store", "cardbox common.png");

		// back-btn
		const back_btn = this.add.ellipse(41, 41, 128, 128);
		back_btn.scaleX = 0.25;
		back_btn.scaleY = 0.25;
		back_btn.isFilled = true;
		back_btn.fillColor = 0;

		// bg-coin-counter
		const bg_coin_counter = this.add.rectangle(281, 40, 128, 128);
		bg_coin_counter.scaleY = 0.25;
		bg_coin_counter.isFilled = true;
		bg_coin_counter.fillColor = 0;

		// coin_01_png
		const coin_01_png = this.add.image(242, 46, "coins", "coin-01.png");
		coin_01_png.scaleX = 2;
		coin_01_png.scaleY = 2;

		// lock_png
		this.add.image(40, 227, "store", "lock.png");

		// ellipse_1
		const ellipse_1 = this.add.ellipse(180, 611, 128, 128);
		ellipse_1.scaleX = 0.09;
		ellipse_1.scaleY = 0.09;
		ellipse_1.isFilled = true;

		// nav carrusel-mockupcenter
		const nav_carrusel_mockupcenter = this.add.ellipse(201, 611, 128, 128);
		nav_carrusel_mockupcenter.scaleX = 0.09;
		nav_carrusel_mockupcenter.scaleY = 0.09;
		nav_carrusel_mockupcenter.isFilled = true;

		// nav carrusel-mockupleft
		const nav_carrusel_mockupleft = this.add.ellipse(154, 611, 128, 128);
		nav_carrusel_mockupleft.scaleX = 0.09;
		nav_carrusel_mockupleft.scaleY = 0.09;
		nav_carrusel_mockupleft.isFilled = true;

		this.events.emit("scene-awake");
	}

	/* START-USER-CODE */

	// Write your code here

	create() {

		this.editorCreate();
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
