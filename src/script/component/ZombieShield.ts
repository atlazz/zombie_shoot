import Bullet from "../component/Bullet";

export default class ZombieShield extends Laya.Script3D {

    public zombieShield: Laya.MeshSprite3D;

    public isAttacked: Boolean = false;

    public origin_life: number = 100;
    public life: number;

    /** 碰撞检测白名单 */
    private collisionWhiteList: string[] = ["bullet"];

    constructor() {
        super();
    }

    onAwake() {
        this.zombieShield = this.owner as Laya.MeshSprite3D;
        this.life = this.origin_life;
    }

    public onTriggerEnter(other: Laya.PhysicsComponent): void {
        let otherSp: Laya.MeshSprite3D = other.owner as Laya.MeshSprite3D;
        if (this.collisionWhiteList.indexOf(otherSp.name) >= 0) {
            console.log("shield trigger enter: " + otherSp.name);

            let bullet: Bullet = (other.owner as Laya.MeshSprite3D).getComponent(Bullet) as Bullet;
            // update life
            this.life -= bullet.power;
            console.log("shield life: " + this.life + "/" + this.origin_life);

            this.isAttacked = true;
            if (this.life <= 0) {
                console.log("shield borken")
                Laya.timer.frameOnce(1, this, () => {
                    // play shield broken effect
                    this.zombieShield.active = false;
                });
            }

            bullet.broken();
        }
    }

    public onCollisionEnter(collision: Laya.Collision) {
        let otherSp: Laya.MeshSprite3D = collision.other.owner as Laya.MeshSprite3D;
        if (this.collisionWhiteList.indexOf(otherSp.name) >= 0) {
            console.log("shield collision enter");
        }
    }

    public onTriggerStay(other: Laya.PhysicsComponent): void {
        // console.log("shield trigger stay");
    }

    public onTriggerExit(other: Laya.PhysicsComponent): void {
        // console.log("shield trigger exit");
    }

    onUpdate() {
        // let zombieCollider: Laya.PhysicsCollider = this.zombieShield.getComponent(Laya.PhysicsCollider);
        // zombieCollider.
    }
}