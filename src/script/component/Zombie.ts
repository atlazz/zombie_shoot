import Bullet from "../component/Bullet";
import ZombieShield from "./ZombieShield";

export default class Zombie extends Laya.Script3D {
    private zombie: Laya.MeshSprite3D;
    private moveStep: number = 0.001;

    private isAttacked: Boolean = false;

    /**被击退的标准速度（方向）**/
    public repelledV3: Laya.Vector3 = new Laya.Vector3();

    public origin_life: number = 1000;
    public life: number;

    /** 碰撞检测白名单 */
    private collisionWhiteList: string[] = ["bullet"];

    constructor() {
        super();
    }

    onAwake() {
        this.zombie = this.owner as Laya.MeshSprite3D;
        this.life = this.origin_life;
    }

    /**
     * 当其他碰撞器进入绑定物体碰撞器时触发（子弹击中盒子时）
     * 注：如相对移动速度过快，可能直接越过
     */
    public onTriggerEnter(other: Laya.PhysicsComponent): void {
        let otherSp: Laya.MeshSprite3D = other.owner as Laya.MeshSprite3D;
        if (this.collisionWhiteList.indexOf(otherSp.name) >= 0) {
            console.log("zombie trigger enter: " + otherSp.name);

            // let shield = this.owner.parent.getChildAt(0).getComponent(ZombieShield);
            // if (shield && shield.isAttacked) {
            //     shield.isAttacked = false;
            //     return;
            // }

            let bullet: Bullet = (other.owner as Laya.MeshSprite3D).getComponent(Bullet) as Bullet;
            //获取子弹速度为
            this.repelledV3 = bullet.speedV3.clone();
            //被攻击速度归一化成单位一向量
            // Laya.Vector3.normalize(this.repelledV3, this.repelledV3);
            this.repelledV3.x /= 10;
            this.repelledV3.y /= 10;
            this.repelledV3.z /= 10;
            //设置为被攻击状态
            this.isAttacked = true;
            this.zombie.transform.localPositionZ -= 0.1;

            // update life
            this.life -= bullet.power;
            console.log("zombie life: " + this.life + "/" + this.origin_life);
            if (this.life <= 0) {
                console.log("zombie died")
                Laya.timer.frameOnce(1, this, function () {
                    this.zombie.removeSelf();
                });
            }
        }
    }

    public onCollisionEnter(collision: Laya.Collision) {
        let otherSp: Laya.MeshSprite3D = collision.other.owner as Laya.MeshSprite3D;
        if (this.collisionWhiteList.indexOf(otherSp.name) >= 0) {
            console.log("zombie collision enter");
        }
    }

    public onTriggerStay(other: Laya.PhysicsComponent): void {
        // console.log("zombie trigger stay");
    }

    public onTriggerExit(other: Laya.PhysicsComponent): void {
        // console.log("zombie trigger exit");
    }

    onUpdate() {
        // 玩家死亡判断, 僵尸与玩家距离过近
        if (this.zombie.transform.localPositionZ > 4.9) {
            console.log("Player died.");
        }

        // 摆正角度
        this.zombie.transform.localRotationEulerX = 0;
        this.zombie.transform.localRotationEulerY = 0;
        this.zombie.transform.localRotationEulerZ = 0;

        // update postion
        if (!this.isAttacked) {
            this.zombie.transform.localPositionZ += this.moveStep;
        }

        // reset
        this.isAttacked = false;
    }
}