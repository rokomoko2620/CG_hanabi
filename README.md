# 線香花火 3D シミュレーション

Three.jsを使用したリアルな線香花火のWebGLシミュレーションです。

## 特徴

- 線香花火の4段階（蕾→牡丹→松葉→散り菊）を再現
- 3種類の火花タイプを切り替え可能
- 360度自由にカメラを回転して鑑賞
- Bloomエフェクトによるリアルな発光表現

## 火花タイプ

| タイプ | 特徴 |
|--------|------|
| タイプ 1 | 枝分かれする火花。液滴が破裂するように最大10回まで分岐 |
| タイプ 2 | シェーダー火花。GPU計算による滑らかな揺らぎと軌跡 |
| タイプ 3 | 流星タイプ。長い尾を引く火花 |

## 技術スタック

- Three.js r128
- WebGL / GLSL
- EffectComposer（Bloom）
- OrbitControls

## ファイル構成
```
├── index.html    # メインHTML
├── type1.js      # 枝分かれパーティクル
├── type2.js      # シェーダー火花
└── type3.js      # 流星タイプ
```

## 使い方

1. ファイルをダウンロード
2. ローカルサーバーで起動（例：`npx serve`）
3. ブラウザで `index.html` を開く
4. 「着火」ボタンをクリック

## 操作方法

| 操作 | 動作 |
|------|------|
| 左ドラッグ | カメラ回転 |
| 右ドラッグ | カメラ移動 |
| スクロール | ズーム |
| UI表示/非表示ボタン | UIの切り替え |

## 技術解説

### パーティクルシステム

火花の描画には `LineSegments` と `Points` を組み合わせて使用しています。
```javascript
// 軌跡はLineSegmentsで描画
this.lines = new THREE.LineSegments(lineGeometry, lineMaterial);

// 先端はPointsで描画
this.points = new THREE.Points(pointGeometry, pointMaterial);
```

### 物理シミュレーション
```javascript
// 重力
spark.vy += gravity * dt;

// 空気抵抗
spark.vx *= Math.pow(drag, dt * 60);
spark.vy *= Math.pow(drag, dt * 60);
spark.vz *= Math.pow(drag, dt * 60);

// 位置更新
spark.x += spark.vx * dt;
spark.y += spark.vy * dt;
spark.z += spark.vz * dt;
```

### 火球シェーダー
```glsl
// 頂点シェーダー：表面の揺らぎ
float noise = sin(position.x * 12.0 + time * 6.0) *
              sin(position.y * 12.0 + time * 5.0) *
              sin(position.z * 12.0 + time * 7.0);
vec3 pos = position * (1.0 + noise * 0.1);

// フラグメントシェーダー：フレネル効果
float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), 2.0);
vec3 color = mix(coreColor, edgeColor, fresnel);
```

## ライセンス

MIT License
