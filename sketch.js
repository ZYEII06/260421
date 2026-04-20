let frames = [];
let filmStrip;
let clickSound;
// 特效變數
let flashAlpha = 0; // 控制快門閃光透明度
let currentGlowColor, targetGlowColor; // 用於平滑切換背景顏色
// 作業資料陣列
let homeworkData = [
  { title: "WEEK 01", url: "https://zyeii06.github.io/w1/", thumbnailUrl: "w1.png", glowColor: [0, 242, 255] },     // 青色
  { title: "WEEK 02", url: "https://zyeii06.github.io/w2/", thumbnailUrl: "w2.png", glowColor: [255, 100, 50] },   // 橘紅色
  { title: "WEEK 03", url: "https://zyeii06.github.io/w3/", thumbnailUrl: "w3.png", glowColor: [100, 255, 50] },   // 嫩綠色
  { title: "WEEK 04", url: "https://zyeii06.github.io/w4/", thumbnailUrl: "w4.png", glowColor: [255, 50, 150] },   // 桃紅色
  { title: "WEEK 05", url: "https://zyeii06.github.io/20260411/", thumbnailUrl: "w5.png", glowColor: [150, 50, 255] } // 紫色
];

// 預載入所有縮圖
function preload() {
  clickSound = loadSound('malarbrush-camera-flash-204151.mp3');
  for (let i = 0; i < homeworkData.length; i++) {
    if (homeworkData[i].thumbnailUrl) {
      homeworkData[i].thumbnail = loadImage(homeworkData[i].thumbnailUrl);
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  filmStrip = new FilmStrip();
  
  // 初始化顏色物件 (預設為青色)
  currentGlowColor = color(0, 242, 255);
  targetGlowColor = color(0, 242, 255);

  // 設定膠卷格之間的間距
  let spacing = 450;
  for (let i = 0; i < homeworkData.length; i++) {
    frames.push(new FilmFrame(i * spacing + width / 2, height / 2, homeworkData[i]));
  }
}

function draw() {
  background(10);
  
  // --- 更新與判斷邏輯 ---
  filmStrip.update();
  let closestFrame = null;
  let minDistance = Infinity;
  for (let frame of frames) {
    frame.update();
    // 找出離畫面水平中心最近的畫框
    let d = abs(frame.currentX - width / 2);
    if (d < minDistance) {
      minDistance = d;
      closestFrame = frame;
    }
  }

  // 根據中心畫框切換目標顏色
  if (closestFrame && closestFrame.data.glowColor) {
    let c = closestFrame.data.glowColor;
    targetGlowColor = color(c[0], c[1], c[2]);
  }
  // 平滑過渡當前光暈顏色
  currentGlowColor = lerpColor(currentGlowColor, targetGlowColor, 0.05);

  // --- 繪製投影機背景光影 ---
  drawProjectorLight();

  // 視差效果
  let parallaxX = map(mouseX, 0, width, -30, 30);
  
  push();
  translate(parallaxX, 0);
  
  filmStrip.display();
  
  for (let frame of frames) {
    frame.display();
  }
  pop();
  
  // 繪製左上角個人資訊 (包含霓虹發光特效)
  push();
  fill(0, 242, 255);
  noStroke();
  drawingContext.shadowBlur = 15; // 設定發光強度
  drawingContext.shadowColor = color(0, 242, 255); // 設定發光顏色
  textAlign(LEFT, TOP);
  textSize(18);
  text("教科一A 414730670 呂俞錚", 30, 30);
  pop();

  // 繪製指示文字
  fill(0, 242, 255);
  noStroke();
  textAlign(CENTER);
  textSize(14); // 保持此文字大小
  text("DRAG OR HOVER TO EXPLORE | CLICK TO OPEN PROJECT", width/2, height - 50);

  // --- 老電影膠卷特效 ---
  drawOldFilmEffects();

  // --- 黑色換格閃爍特效 (模擬老電影) ---
  if (flashAlpha > 0) {
    push();
    noStroke();
    fill(0, flashAlpha); // 黑色閃爍
    rectMode(CORNER);
    rect(0, 0, width, height);
    // 每一影格減少透明度，模擬快門快速開闔
    flashAlpha -= 50; 
    pop();
  }
}

function drawOldFilmEffects() {
  // 1. 噪點效果 (Grain) - 每一影格繪製隨機微小點
  push();
  strokeWeight(1.2);
  for (let i = 0; i < 60; i++) {
    let x = random(width);
    let y = random(height);
    // 使用淡灰色，透明度隨機，讓噪點若隱若現
    stroke(255, random(10, 40)); 
    point(x, y);
  }
  pop();

  // 2. 隨機垂直刮痕 (Scratches)
  if (random(1) < 0.1) { // 約 10% 的機率出現垂直細線
    push();
    let x = random(width);
    stroke(200, random(20, 70));
    strokeWeight(random(0.3, 1));
    // 線條稍微傾斜一點點會更自然
    line(x, 0, x + random(-1, 1), height);
    pop();
  }

  // 3. 隨機白污點 (Dust Spots)
  if (random(1) < 0.04) {
    push();
    noStroke();
    fill(255, random(30, 80));
    let size = random(1, 4);
    ellipse(random(width), random(height), size, size);
    pop();
  }
}

function drawProjectorLight() {
  push();
  // 1. 計算晃動 (使用 noise 讓晃動感更自然)
  let jitterX = (noise(frameCount * 0.1) - 0.5) * 15;
  let jitterY = (noise(frameCount * 0.1 + 100) - 0.5) * 10;

  // 2. 計算閃爍 (模擬投影燈泡亮度不均)
  let flickerAlpha = map(noise(frameCount * 0.2), 0, 1, 10, 35);

  // 3. 使用 Canvas 原生漸變實作放射狀光影 (WebGL 模式下需特別處理，但 P2D 模式可用 drawingContext)
  // 漸變中心點位於畫面中上方
  let centerX = width / 2 + jitterX;
  let centerY = height * 0.4 + jitterY;

  let grad = drawingContext.createRadialGradient(centerX, centerY, 50, centerX, centerY, width * 0.8);
  
  let r = red(currentGlowColor);
  let g = green(currentGlowColor);
  let b = blue(currentGlowColor);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${flickerAlpha / 255})`); // 中心使用動態顏色
  grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${flickerAlpha * 0.3 / 255})`); // 中層顏色變淡
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)'); // 邊緣全透明

  drawingContext.fillStyle = grad;
  noStroke();
  rect(0, 0, width, height);
  pop();
}

// --- Class: 膠卷底片 (Vertex & For Loop) ---
class FilmStrip {
  constructor() {
    this.y = height / 2;
    this.h = 320;
    this.offset = 0;
    this.velocity = 0; // 用於儲存目前的滾動速度
  }

  update() {
    let targetSpeed = 0;

    // 只有在滑鼠位置改變（移動中）時，才根據 X 座標計算目標速度
    // 當滑鼠停止移動，targetSpeed 就會維持在 0
    if (mouseX !== pmouseX || mouseY !== pmouseY) {
      targetSpeed = map(mouseX, 0, width, -15, 15);
    }

    // 使用 lerp 讓 current velocity 逐漸接近 targetSpeed 達成慣性
    // 0.05 是平滑係數，數值越小，減速過程就越長（慣性越重）
    this.velocity = lerp(this.velocity, targetSpeed, 0.05);
    this.offset -= this.velocity;
  }

  display() {
    noFill();
    stroke(0, 242, 255, 150);
    strokeWeight(3);
    
    for (let side of [-1, 1]) {
      let edgeY = this.y + (side * this.h / 2);
      
      // 使用 Vertex 繪製帶波浪感的底片邊緣
      beginShape();
      for (let x = -100; x <= width + 100; x += 30) {
        let nx = x - this.offset;
        let noiseY = edgeY + noise(nx * 0.005, frameCount * 0.01) * 20;
        vertex(x, noiseY);
      }
      endShape();
      
      // 繪製齒孔
      this.drawSprockets(edgeY + (side * -20));
    }
  }

  drawSprockets(y) {
    fill(0, 242, 255, 200);
    noStroke();
    let startX = this.offset % 50;
    for (let x = startX - 50; x < width + 50; x += 50) {
      rectMode(CENTER);
      rect(x, y, 12, 18, 2); // 使用內建 rect 但模擬 vertex 效果
    }
  }
}

// --- Class: 膠卷格 (Class & Interaction) ---
class FilmFrame {
  constructor(x, y, data) {
    this.baseX = x;
    this.y = y;
    this.data = data;
    this.w = 350;
    this.h = 220;
    this.scale = 1.0;
  }

  update() {
    this.currentX = this.baseX + filmStrip.offset;
    
    // 無限循環滾動
    let totalW = homeworkData.length * 450;
    if (this.currentX < -this.w) { // 向左捲出邊界
      this.baseX += totalW;
    } else if (this.currentX > width + this.w) { // 向右捲出邊界
      this.baseX -= totalW;
    }

    // 判斷滑鼠是否懸停 (優化為矩形區域判定)
    if (mouseX > this.currentX - this.w/2 && mouseX < this.currentX + this.w/2 &&
        mouseY > this.y - this.h/2 && mouseY < this.y + this.h/2) {
      this.scale = lerp(this.scale, 1.15, 0.1);
    } else {
      this.scale = lerp(this.scale, 1.0, 0.1);
    }
  }

  display() {
    push();
    translate(this.currentX, this.y);
    scale(this.scale);

    let isHovered = this.scale > 1.05;
    
    // 預覽效果：增強霓虹發光與改變顏色
    drawingContext.shadowBlur = isHovered ? 40 : 20;
    drawingContext.shadowColor = isHovered ? color(255, 255, 255) : color(0, 242, 255);
    
    // 膠捲格主體
    fill(isHovered ? 40 : 20, isHovered ? 40 : 20, isHovered ? 50 : 20, 240);
    stroke(isHovered ? 255 : 0, 242, 255);
    strokeWeight(isHovered ? 3 : 2);
    rectMode(CENTER);
    rect(0, 0, this.w, this.h, 8);
    
    // 文字資訊
    drawingContext.shadowBlur = 0;
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);

    // 調整標題位置
    textSize(22);
    if (isHovered && this.data.thumbnail) {
      text(this.data.title, 0, -60); // 懸停並有縮圖時，標題上移
    } else {
      text(this.data.title, 0, -10); // 否則保持原位
    }

    if (isHovered && this.data.thumbnail) {
      // 懸停時顯示縮圖
      let thumb = this.data.thumbnail;
      let thumbWidth = this.w * 0.8; // 縮圖寬度為膠卷格的80%
      let thumbHeight = this.h * 0.6; // 縮圖高度為膠卷格的60%

      // 保持縮圖的長寬比
      let aspectRatio = thumb.width / thumb.height;
      if (thumbWidth / thumbHeight > aspectRatio) {
        thumbWidth = thumbHeight * aspectRatio;
      } else {
        thumbHeight = thumbWidth / aspectRatio;
      }
      imageMode(CENTER);
      image(thumb, 0, 20, thumbWidth, thumbHeight); // 縮圖位置在標題下方
    } else {
      // 否則顯示文字提示
      textSize(12);
      fill(isHovered ? 255 : 0, 242, 255);
      text(isHovered ? "> ENTER PROJECT <" : "VIEW DETAILS", 0, 30);
    }
    
    pop();
  }

  isClicked() {
    if (mouseX > this.currentX - this.w/2 && mouseX < this.currentX + this.w/2 &&
        mouseY > this.y - this.h/2 && mouseY < this.y + this.h/2) {
      this.openIframe();
    }
  }

  openIframe() {
    const overlay = document.getElementById('gallery-overlay');
    const container = document.getElementById('iframe-container');
    const loader = document.getElementById('loader');
    
    overlay.style.display = 'block';
    loader.style.display = 'block'; // 顯示載入動畫
    
    container.innerHTML = `<iframe src="${this.data.url}"></iframe>`;
    
    // 當 iframe 載入完成時，隱藏動畫
    const iframe = container.querySelector('iframe');
    iframe.onload = () => {
      loader.style.display = 'none';
    };
  }
}

function mousePressed() {
  // 確保音訊上下文在使用者點擊後啟動（瀏覽器安全要求）
  userStartAudio();
  
  if (mouseButton === LEFT) {
    clickSound.play();
    flashAlpha = 255; // 觸發黑色換格效果 (起始設為全黑)
  }
  for (let frame of frames) {
    frame.isClicked();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}