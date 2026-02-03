// Type3SparkSystem - 流星タイプ・長い尾を引く火花
class Type3SparkSystem {
    constructor(scene) {
        this.scene = scene;
        this.sparks = [];
        this.maxSparks = 2500;

        // LineSegmentsで長い軌跡を描画
        this.lineGeometry = new THREE.BufferGeometry();
        this.linePositions = new Float32Array(this.maxSparks * 14 * 6);
        this.lineColors = new Float32Array(this.maxSparks * 14 * 6);

        this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(this.linePositions, 3));
        this.lineGeometry.setAttribute('color', new THREE.BufferAttribute(this.lineColors, 3));

        this.lineMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true
        });

        this.lines = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);

        // 先端のポイント
        this.pointGeometry = new THREE.BufferGeometry();
        this.pointPositions = new Float32Array(this.maxSparks * 3);
        this.pointColors = new Float32Array(this.maxSparks * 3);
        this.pointSizes = new Float32Array(this.maxSparks);

        this.pointGeometry.setAttribute('position', new THREE.BufferAttribute(this.pointPositions, 3));
        this.pointGeometry.setAttribute('color', new THREE.BufferAttribute(this.pointColors, 3));
        this.pointGeometry.setAttribute('size', new THREE.BufferAttribute(this.pointSizes, 1));

        this.pointMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec4 mv = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (200.0 / -mv.z);
                    gl_Position = projectionMatrix * mv;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    float d = length(gl_PointCoord - 0.5);
                    if (d > 0.5) discard;
                    float i = exp(-d * d * 15.0);
                    gl_FragColor = vec4(vColor * i + vec3(1.0, 0.8, 0.5) * i * 0.5, i);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true
        });

        this.points = new THREE.Points(this.pointGeometry, this.pointMaterial);
    }

    addToScene() {
        this.scene.add(this.lines);
        this.scene.add(this.points);
    }

    removeFromScene() {
        this.scene.remove(this.lines);
        this.scene.remove(this.points);
    }

    createSpark(x, y, z, vx, vy, vz, life, size) {
        if (this.sparks.length >= this.maxSparks) return null;
        
        const spark = {
            x, y, z, vx, vy, vz,
            life, maxLife: life,
            size,
            trail: Array(14).fill(null).map(() => ({ x, y, z })),
            canBranch: Math.random() < 0.4,
            branched: false
        };
        this.sparks.push(spark);
        return spark;
    }

    update(dt) {
        const gravity = -3.2;
        const drag = 0.93;
        const newSparks = [];

        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const s = this.sparks[i];

            // 軌跡更新
            s.trail.pop();
            s.trail.unshift({ x: s.x, y: s.y, z: s.z });

            s.vy += gravity * dt;
            s.vx *= Math.pow(drag, dt * 60);
            s.vy *= Math.pow(drag, dt * 60);
            s.vz *= Math.pow(drag, dt * 60);

            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.z += s.vz * dt;
            s.life -= dt;

            // 枝分かれ
            if (s.canBranch && !s.branched && s.life < s.maxLife * 0.6 && s.life > s.maxLife * 0.15) {
                if (Math.random() < 0.08) {
                    const count = 2 + Math.floor(Math.random() * 3);
                    for (let j = 0; j < count; j++) {
                        const theta = Math.random() * Math.PI * 2;
                        const phi = Math.random() * Math.PI;
                        const spd = 0.4 + Math.random() * 0.4;
                        newSparks.push({
                            x: s.x, y: s.y, z: s.z,
                            vx: s.vx * 0.2 + Math.sin(phi) * Math.cos(theta) * spd,
                            vy: s.vy * 0.2 + Math.sin(phi) * Math.sin(theta) * spd,
                            vz: s.vz * 0.2 + Math.cos(phi) * spd,
                            life: s.life * 0.5, maxLife: s.life * 0.5,
                            size: s.size * 0.7,
                            trail: Array(14).fill(null).map(() => ({ x: s.x, y: s.y, z: s.z })),
                            canBranch: Math.random() < 0.2, branched: false
                        });
                    }
                    s.branched = true;
                }
            }

            if (s.life <= 0) {
                this.sparks.splice(i, 1);
            }
        }

        for (const spark of newSparks) {
            if (this.sparks.length < this.maxSparks) {
                this.sparks.push(spark);
            }
        }

        this.updateBuffers();
    }

    updateBuffers() {
        const count = Math.min(this.sparks.length, this.maxSparks);
        let lineIdx = 0;

        for (let i = 0; i < count; i++) {
            const s = this.sparks[i];
            const lifeRatio = Math.max(0, s.life / s.maxLife);

            // 色計算
            const hue = 0.08 - (1 - lifeRatio) * 0.05;
            const color = new THREE.Color().setHSL(hue, 1, 0.6);

            // 先端ポイント
            this.pointPositions[i * 3] = s.x;
            this.pointPositions[i * 3 + 1] = s.y;
            this.pointPositions[i * 3 + 2] = s.z;
            this.pointColors[i * 3] = color.r * lifeRatio;
            this.pointColors[i * 3 + 1] = color.g * lifeRatio;
            this.pointColors[i * 3 + 2] = color.b * lifeRatio;
            this.pointSizes[i] = s.size * 45 * lifeRatio;

            // 軌跡ライン
            for (let j = 0; j < s.trail.length - 1; j++) {
                if (lineIdx >= this.maxSparks * 14) break;
                
                const t0 = s.trail[j];
                const t1 = s.trail[j + 1];
                const fade = (1 - j / s.trail.length) * lifeRatio;
                const fadeNext = (1 - (j + 1) / s.trail.length) * lifeRatio;

                this.linePositions[lineIdx * 6] = t0.x;
                this.linePositions[lineIdx * 6 + 1] = t0.y;
                this.linePositions[lineIdx * 6 + 2] = t0.z;
                this.linePositions[lineIdx * 6 + 3] = t1.x;
                this.linePositions[lineIdx * 6 + 4] = t1.y;
                this.linePositions[lineIdx * 6 + 5] = t1.z;

                this.lineColors[lineIdx * 6] = color.r * fade;
                this.lineColors[lineIdx * 6 + 1] = color.g * fade * 0.7;
                this.lineColors[lineIdx * 6 + 2] = color.b * fade * 0.3;
                this.lineColors[lineIdx * 6 + 3] = color.r * fadeNext;
                this.lineColors[lineIdx * 6 + 4] = color.g * fadeNext * 0.7;
                this.lineColors[lineIdx * 6 + 5] = color.b * fadeNext * 0.3;

                lineIdx++;
            }
        }

        for (let i = count; i < this.maxSparks; i++) {
            this.pointPositions[i * 3 + 1] = -1000;
            this.pointSizes[i] = 0;
        }

        this.lineGeometry.attributes.position.needsUpdate = true;
        this.lineGeometry.attributes.color.needsUpdate = true;
        this.pointGeometry.attributes.position.needsUpdate = true;
        this.pointGeometry.attributes.color.needsUpdate = true;
        this.pointGeometry.attributes.size.needsUpdate = true;

        this.lineGeometry.setDrawRange(0, lineIdx * 2);
        this.pointGeometry.setDrawRange(0, count);
    }

    clear() {
        this.sparks = [];
        this.updateBuffers();
    }

    dispose() {
        this.lineGeometry.dispose();
        this.lineMaterial.dispose();
        this.pointGeometry.dispose();
        this.pointMaterial.dispose();
    }
}
