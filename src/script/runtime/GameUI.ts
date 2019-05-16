import { ui } from "./../../ui/layaMaxUI";
import * as Const from "../Const";
import Zombie from "../component/Zombie";
import ZombieShield from "../component/ZombieShield";
import Bullet from "../component/Bullet";

export default class GameUI extends ui.test.TestSceneUI {
    private scene3D: Laya.Scene3D;

    private camera: Laya.Camera;

    /** game scene */
    private ground: Laya.MeshSprite3D;
    private gamescene: Laya.MeshSprite3D;

    /** bullet */
    private _bullet: Laya.MeshSprite3D;
    private bulletRadius: number = 0.02;
    private bulletVelocity: number = 0.5;
    private bullet_origin: Laya.Vector3;

    /** zombie */
    private _zombie: Laya.MeshSprite3D;
    private zomnbieAni: Laya.Animator;
    private zombieId: number = 0;

    /** player */
    private player: Laya.MeshSprite3D;
    private playerAni: Laya.Animator;
    private shootTime: number = 0;

    constructor() {
        super();

        this.initScene3D();

        this.initGround();

        this.initZombie();

        this.initBullet();

        this.initPlayer();
    }

    /** intialize scene */
    private initScene3D() {
        // add scene
        this.scene3D = Laya.stage.addChild(new Laya.Scene3D()) as Laya.Scene3D;

        // add camera
        this.camera = (this.scene3D.addChild(new Laya.Camera(0, 0.1, 100))) as Laya.Camera;
        this.camera.transform.localPosition = Const.CameraInitPos.clone();
        this.camera.transform.localRotationEuler = Const.CameraInitRot.clone();

        // add direction light
        var directionLight: Laya.DirectionLight = this.scene3D.addChild(new Laya.DirectionLight()) as Laya.DirectionLight;
        directionLight.color = new Laya.Vector3(0.6, 0.6, 0.6);
        directionLight.transform.localRotationEuler = new Laya.Vector3(-45, 0, 0);

        // load game scene
        // Laya.Sprite3D.load("res/scene.lh", Laya.Handler.create(this, (res) => {
        //     this.gamescene = this.scene3D.addChild(res) as Laya.MeshSprite3D;
        //     this.gamescene.name = "game_scene";
        // }));
    }

    /** initialize player mesh */
    private initPlayer() {
        Laya.Sprite3D.load(Const.PlayerResUrl, Laya.Handler.create(this, (res) => {
            this.player = res;
            this.scene3D.addChild(this.player);
            this.playerAni = this.player.getComponent(Laya.Animator);
            this.player.transform.localPosition = Const.PlayerInitPos.clone();
            this.player.transform.localRotationEuler = Const.PlayerInitRot.clone();
            this.player.transform.localScale = Const.PlayerInitScale.clone();

            this.player.name = "player";

            // mouse click event listen: shoot a bullet
            Laya.stage.on(Laya.Event.CLICK, this, this.onClick);

            // onUpdate
            this.initGameStage();
        }));
    }

    /** initialize zombie mesh */
    private initZombie() {
        Laya.Sprite3D.load("res/zombie_police.lh", Laya.Handler.create(this, (res) => {
            this._zombie = res;
            // this.zomnbieAni = this._zombie.getComponent(Laya.Animator);
            this._zombie.transform.localRotationEulerX += 90;
            this._zombie.transform.localScale = Const.PlayerInitScale.clone();

            this._zombie.name = "_zombie";
        }));
    }

    /** initialize bullet mesh */
    private initBullet() {
        this._bullet = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createSphere(this.bulletRadius));
        let mat: Laya.BlinnPhongMaterial = new Laya.BlinnPhongMaterial();
        mat.albedoColor = new Laya.Vector4(1, 0, 0, 1);
        this._bullet.meshRenderer.material = mat;
        // add collider
        let bulletCollider: Laya.PhysicsCollider = this._bullet.addComponent(Laya.PhysicsCollider);
        let bulletColliderShape: Laya.MeshColliderShape = new Laya.MeshColliderShape();
        bulletColliderShape.mesh = this._bullet.meshFilter.sharedMesh;
        bulletCollider.colliderShape = bulletColliderShape;
        // 快速移动物体连续检测
        bulletCollider.ccdMotionThreshold = 0.0001;
        bulletCollider.ccdSweptSphereRadius = this.bulletRadius;
        bulletCollider.isTrigger = true;
        // let bulletRigid: Laya.Rigidbody3D = this._bullet.addComponent(Laya.Rigidbody3D);
        // bulletRigid.colliderShape = new Laya.SphereColliderShape(0.02);
        // bulletRigid.gravity = new Laya.Vector3(0, 0, 0);
        // set bullets' original point
        this.bullet_origin = new Laya.Vector3(0, 0, 1);

        this._bullet.name = "_bullet";
    }

    /** initialize ground */
    private initGround() {
        this.ground = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createPlane(20, 20));
        this.scene3D.addChild(this.ground);
        let groundCollider: Laya.Rigidbody3D = this.ground.addComponent(Laya.Rigidbody3D);
        let groundColliderShape: Laya.MeshColliderShape = new Laya.MeshColliderShape();
        groundColliderShape.mesh = this.ground.meshFilter.sharedMesh;
        groundCollider.colliderShape = groundColliderShape;
        groundCollider.isKinematic = true;

        this.ground.name = "ground";
    }

    /** init game stage: zombie */
    private initGameStage() {
        this.zombieId = 0;
        let cnt = 0;
        
        // 设置玩家射击动作循环播放
        this.playerAni.getDefaultState().clip.islooping = true;
        this.playerAni.play();
        Laya.timer.frameLoop(1, this, () => {
            // create zombies
            if (this._zombie && cnt++ % 60 === 0 && this.zombieId < 10) {
                this.createZombie();
                this.zombieId++;
            }

            // play shooting animation
            this.shootTime--;
            if (this.shootTime < 0) {
                // stop playing
                this.playerAni.speed = 0;
            }
        });
    }

    /** create a zombie */
    private createZombie() {
        let zombie: Laya.MeshSprite3D = this._zombie.clone();
        this.scene3D.addChild(zombie);
        zombie.getComponent(Laya.Rigidbody3D).isKinematic = false;
        zombie.getChildAt(0).getComponent(Laya.Rigidbody3D).isKinematic = false;

        // add zombie body script
        zombie.addComponent(Zombie);
        // add zombie shield script
        zombie.getChildAt(0).addComponent(ZombieShield);

        zombie.transform.localPositionX += (Math.random() - 0.5) * 2;

        zombie.name = "zombie_" + this.zombieId;

        console.log("new zombie: " + zombie.name);

        // let zombie1: Laya.MeshSprite3D = this._zombie.clone();
        // this.scene3D.addChild(zombie1);
        // zombie1.getComponent(Laya.Rigidbody3D).isKinematic = true;
        // zombie1.addComponent(Zombie);
        // zombie1.getChildAt(0).addComponent(ZombieShield);
        // zombie1.transform.localPositionX += 0.5;
        // zombie1.transform.localRotationEulerY += 90;
        // zombie1.name = "zombie_1";

        // let zombie2: Laya.MeshSprite3D = this._zombie.clone();
        // this.scene3D.addChild(zombie2);
        // zombie2.getComponent(Laya.Rigidbody3D).isKinematic = true;
        // zombie2.addComponent(Zombie);
        // zombie2.getChildAt(0).addComponent(ZombieShield);
        // zombie2.transform.localPositionX -= 0.5;
        // zombie2.transform.localPositionY += 0.2;
        // zombie2.transform.localRotationEulerX += 90;
        // zombie2.name = "zombie_2";
    }

    /** mouse click event: shoot a bullet */
    private onClick() {
        // play shoot animation
        this.shootTime = Const.PlayerShootLifeTime;
        this.playerAni.speed = 1;

        // get ray
        let point: Laya.Vector2 = new Laya.Vector2();
        point.x = Laya.MouseManager.instance.mouseX;
        point.y = Laya.MouseManager.instance.mouseY;
        let ray: Laya.Ray = new Laya.Ray(new Laya.Vector3(0, 0, 0), new Laya.Vector3(0, 0, 0));
        this.camera.viewportPointToRay(point, ray);

        // raycast detection
        let hitResult: Laya.HitResult[] = [];
        if (this.scene3D.physicsSimulation.rayCastAll(ray, hitResult, 30)) {
            for (let item of hitResult) {
                // console.log(item.collider.owner.name);
            }
        }

        // generate bullet
        let bullet: Laya.MeshSprite3D = this._bullet.clone();
        bullet.name = "bullet";
        this.scene3D.addChild(bullet);
        let bulletScript = bullet.addComponent(Bullet);
        bulletScript.setDirection(ray.origin, ray.direction);
    }
}