export class ProjectileHandler {
    constructor(scene) {
        this.scene = scene;
    }

    projectileHitWall(obj1, obj2) {
        const scene = this.scene;
        let projectile = null;
        let wall = null;

        if (obj1.texture && obj1.texture.key === 'projectile') projectile = obj1;
        else if (obj2.texture && obj2.texture.key === 'projectile') projectile = obj2;

        if (obj1.texture && obj1.texture.key === 'wall') wall = obj1;
        else if (obj2.texture && obj2.texture.key === 'wall') wall = obj2;

        if (!wall) {
            if (obj1 === scene.leftWall || obj1 === scene.rightWall) wall = obj1;
            else if (obj2 === scene.leftWall || obj2 === scene.rightWall) wall = obj2;
        }

        if (!projectile) return;
        if (projectile === scene.leftWall || projectile === scene.rightWall) return;
        if (projectile.texture && projectile.texture.key === 'wall') return;

        if (!projectile.active || projectile.getData('processed')) return;

        try {
            projectile.setData('processed', true);
            scene.sparkEmitter.emitParticleAt(projectile.x, projectile.y, 10);

            if (projectile.active) {
                projectile.setActive(false);
                projectile.setVisible(false);
                projectile.destroy();
            }
        } catch (error) {
        }
    }

    hitByProjectile(obj1, obj2) {
        const scene = this.scene;
        let player = null;
        let projectile = null;

        if (obj1.texture && obj1.texture.key === 'player') player = obj1;
        else if (obj2.texture && obj2.texture.key === 'player') player = obj2;

        if (obj1.texture && obj1.texture.key === 'projectile') projectile = obj1;
        else if (obj2.texture && obj2.texture.key === 'projectile') projectile = obj2;

        if (!player && (obj1 === scene.player || obj2 === scene.player)) player = scene.player;

        if (!player || !projectile) return;
        if (!projectile.active || projectile.getData('processed')) return;

        try {
            projectile.setData('processed', true);
            const projX = projectile.x;
            const projVelX = projectile.body ? projectile.body.velocity.x : 0;

            if (scene.isInvincible) {
                if (projectile.active) {
                    projectile.setActive(false);
                    projectile.setVisible(false);
                    projectile.destroy();
                }
                scene.sparkEmitter.emitParticleAt(projX, projectile.y, 10);
                return;
            }

            if (projectile.active) {
                projectile.setActive(false);
                projectile.setVisible(false);
                projectile.destroy();
            }

            try {
                const damageKeys = ['damage_sfx_1', 'damage_sfx_2', 'damage_sfx_3', 'damage_sfx_4', 'damage_sfx_5'];
                const randomKey = Phaser.Utils.Array.GetRandom(damageKeys);
                if (scene.sound && scene.cache.audio.exists(randomKey)) {
                    scene.sound.play(randomKey, { volume: 0.5 });
                }
            } catch (error) {
                console.warn('Error playing damage sound:', error);
            }

            let dir = (player.x < projX) ? -1 : 1;
            if (projVelX > 0) dir = 1; else if (projVelX < 0) dir = -1;
            player.setVelocity(dir * 400, -200);
            player.setTint(0xff0000);
            scene.cameras.main.shake(100, 0.02);
            scene.time.delayedCall(200, () => player.clearTint());
        } catch (error) {
            console.warn('Error handling projectile hit:', error);
        }
    }
}
