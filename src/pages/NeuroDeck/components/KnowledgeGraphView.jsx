import { useGraphInteraction } from "../hooks/useGraphInteraction";
import { GraphPreviewPanel } from "./GraphPreviewPanel";
import React, { useEffect, useRef, useState } from 'react';
import { cosineSimilarity } from '../../../utilities/shared';
import { ActivityIcon, RefreshIcon, NetworkIcon } from './Icons';

export const KnowledgeGraphView = ({ deck, cardEmbeddings, t, onGoToCard, embeddingStatus, embeddingProgress, onRecalculate, focusMode, setFocusMode, onStartFocusStudy }) => {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const animationRef = useRef(null);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isSimulating, setIsSimulating] = useState(true);
  const [clusterThreshold, setClusterThreshold] = useState(0.85);
  const [previewFocalNode, setPreviewFocalNode] = useState(null);
  const [previewMode, setPreviewMode] = useState(focusMode?.mode || 'threshold');
  const [previewThreshold, setPreviewThreshold] = useState(focusMode?.threshold !== undefined ? focusMode.threshold : 0.85);
  const [previewTopN, setPreviewTopN] = useState(focusMode?.topN || 5);

  const nodesRef = useRef([]);
  const edgesRef = useRef([]);

  const { cameraRef, mousePos, hoveredNode, isDraggingRef, handlers } = useGraphInteraction(canvasRef, nodesRef, setPreviewFocalNode);

  const REPULSION = 300;
  const SPRING_LENGTH = 150;
  const SPRING_STRENGTH = 0.02;
  const DAMPING = 0.70;
  const SIMILARITY_THRESHOLD = 0.3; 

  const initSimulation = () => {
    if (!deck || deck.length === 0 || !cardEmbeddings) return;

    const nodes = deck.map((q, index) => ({
      id: q.id,
      originalIndex: index,
      question: q.question,
      score: q.isMastered ? 10 : (q.score || 0),
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      vx: 0,
      vy: 0,
      radius: 8 + (q.attempts > 0 ? 4 : 0),
      embedding: cardEmbeddings[q.id]
    }));

    let globalMax = -Infinity;
    let globalMin = Infinity;
    
    // First Pass: Find the absolute bounds of the semantic space for this specific model + deck
    nodes.forEach(n1 => {
      nodes.forEach(n2 => {
        if (n1.id !== n2.id && n1.embedding && n2.embedding) {
          const sim = cosineSimilarity(n1.embedding, n2.embedding);
          if (sim > globalMax) globalMax = sim;
          if (sim < globalMin) globalMin = sim;
        }
      });
    });
    
    const range = globalMax - globalMin || 1;
    const edgesMap = new Map();
    
    // Second Pass: Build edges using universally normalized weights (0.0 to 1.0)
    nodes.forEach(n1 => {
      const nodeEdges = [];
      nodes.forEach(n2 => {
        if (n1.id !== n2.id && n1.embedding && n2.embedding) {
          const sim = cosineSimilarity(n1.embedding, n2.embedding);
          // Mathematical normalization completely neutralizes the differences between embedding models
          const normalizedWeight = (sim - globalMin) / range;
          nodeEdges.push({ source: n1, target: n2, weight: normalizedWeight, rawSim: sim });
        }
      });
      
      // Sort this specific node's edges by the normalized weight
      nodeEdges.sort((a, b) => b.weight - a.weight);
      
      // Filter edges using the globally normalized ranking:
      // 1. Guaranteed Connectivity: Always keep the top 2 semantic neighbors
      // 2. Cluster Preservation: Keep any edge that falls into the user-defined top % of the graph's global variance
      const topEdges = nodeEdges.filter((e, idx) => {
         if (idx < 2) return true;
         return e.weight >= clusterThreshold;
      });
      
      topEdges.forEach(e => {
        const key = [e.source.id, e.target.id].sort().join('-');
        if (!edgesMap.has(key)) {
          edgesMap.set(key, e);
        }
      });
    });

    const edges = Array.from(edgesMap.values());

    nodesRef.current = nodes;
    edgesRef.current = edges;
    cameraRef.current = { x: 0, y: 0, scale: 1 };
    setIsSimulating(true);
  };

  const [themeColors, setThemeColors] = useState({ 
    accent: '#a855f7', 
    textMuted: 'rgba(255,255,255,0.5)',
    shadowD: 'rgba(0,0,0,0.5)',
    gradL: 'rgba(255,255,255,0.2)',
    gradD: 'rgba(0,0,0,0.2)',
    colorBad: [244, 63, 94],
    colorMid: [251, 146, 60],
    colorGood: [52, 211, 153]
  });

  useEffect(() => {
    initSimulation();
  }, [deck, cardEmbeddings, dimensions, clusterThreshold]);

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    
    const parseRgbArray = (val, fallback) => {
      const parts = val.trim().split(',').map(Number);
      return parts.length === 3 && !parts.some(isNaN) ? parts : fallback;
    };

    setThemeColors({
      accent: style.getPropertyValue('--accent').trim() || '#a855f7',
      textMuted: style.getPropertyValue('--text-muted').trim() || 'rgba(255,255,255,0.5)',
      shadowD: style.getPropertyValue('--shadow-d').trim() || 'rgba(0,0,0,0.5)',
      gradL: style.getPropertyValue('--grad-l').trim() || 'rgba(255,255,255,0.2)',
      gradD: style.getPropertyValue('--grad-d').trim() || 'rgba(0,0,0,0.2)',
      colorBad: parseRgbArray(style.getPropertyValue('--graph-color-bad'), [244, 63, 94]),
      colorMid: parseRgbArray(style.getPropertyValue('--graph-color-mid'), [251, 146, 60]),
      colorGood: parseRgbArray(style.getPropertyValue('--graph-color-good'), [52, 211, 153]),
      colorMastered: parseRgbArray(style.getPropertyValue('--graph-color-mastered'), [168, 85, 247])
    });
  }, []);

  const getGradientColor = (score) => {
     const [r1, g1, b1] = themeColors.colorBad;
     const [r2, g2, b2] = themeColors.colorMid;
     const [r3, g3, b3] = themeColors.colorGood;
     const [r4, g4, b4] = themeColors.colorMastered;

     if (score >= 8) {
         return `rgb(${r4}, ${g4}, ${b4})`;
     }

     let r, g, b;
     if (score <= 3) {
         const t = score / 3;
         r = r1 + t * (r2 - r1);
         g = g1 + t * (g2 - g1);
         b = b1 + t * (b2 - b1);
     } else {
         const t = (score - 3) / 4;
         r = r2 + t * (r3 - r2);
         g = g2 + t * (g3 - g2);
         b = b2 + t * (b3 - b2);
     }
     return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        setDimensions({
          width: wrapperRef.current.clientWidth,
          height: wrapperRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let isRunning = true;

    const step = () => {
      if (!isRunning) return;
      
      if (document.hidden) {
        animationRef.current = requestAnimationFrame(step);
        return;
      }

      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      if (isSimulating) {
        let totalVelocity = 0;

        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const n1 = nodes[i];
            const n2 = nodes[j];
            const dx = n1.x - n2.x;
            const dy = n1.y - n2.y;
            const dist = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
            
            const force = REPULSION / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            n1.vx += fx;
            n1.vy += fy;
            n2.vx -= fx;
            n2.vy -= fy;
          }
        }

        for (const edge of edges) {
          const dx = edge.target.x - edge.source.x;
          const dy = edge.target.y - edge.source.y;
          const dist = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
          
          const targetDist = SPRING_LENGTH * (1 - edge.weight * 0.5);
          const force = (dist - targetDist) * SPRING_STRENGTH * edge.weight;
          
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          edge.source.vx += fx;
          edge.source.vy += fy;
          edge.target.vx -= fx;
          edge.target.vy -= fy;
        }

        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        
        for (const n of nodes) {
           const dx = centerX - n.x;
           const dy = centerY - n.y;
           n.vx += dx * 0.001;
           n.vy += dy * 0.001;
        }

        for (const n of nodes) {
          n.vx *= DAMPING;
          n.vy *= DAMPING;
          n.x += n.vx;
          n.y += n.vy;

          totalVelocity += Math.abs(n.vx) + Math.abs(n.vy);
        }

        if (totalVelocity < 0.02 * nodes.length) {
          setIsSimulating(false); 
        }
      }

      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      ctx.save();
      ctx.translate(cameraRef.current.x, cameraRef.current.y);
      ctx.scale(cameraRef.current.scale, cameraRef.current.scale);

      let inClusterIds = new Set();
      if (previewFocalNode) {
        inClusterIds.add(previewFocalNode.id);
        
        let similarities = [];
        for (const n of nodes) {
           if (n.id !== previewFocalNode.id && n.embedding && previewFocalNode.embedding) {
              const sim = cosineSimilarity(n.embedding, previewFocalNode.embedding);
              similarities.push({ id: n.id, sim });
           }
        }
        
        if (previewMode === 'threshold') {
           similarities.forEach(item => {
              if (item.sim >= previewThreshold) {
                 inClusterIds.add(item.id);
              }
           });
        } else if (previewMode === 'topN') {
           similarities.sort((a, b) => b.sim - a.sim);
           for (let i = 0; i < Math.min(previewTopN - 1, similarities.length); i++) {
              inClusterIds.add(similarities[i].id);
           }
        }
      }

      for (const edge of edges) {
        ctx.beginPath();
        ctx.moveTo(edge.source.x, edge.source.y);
        ctx.lineTo(edge.target.x, edge.target.y);
        ctx.strokeStyle = themeColors.textMuted;
        
        // Dynamically map semantic similarity to visual weight
        // Cubing the weight naturally suppresses weak links and heavily emphasizes strong ones
        const visualWeight = Math.pow(Math.max(0, edge.weight), 3);
        ctx.lineWidth = 0.5 + (visualWeight * 3);
        
        let edgeAlpha = 0.1 + (visualWeight * 0.6);
        if (previewFocalNode) {
           if (inClusterIds.has(edge.source.id) && inClusterIds.has(edge.target.id)) {
              edgeAlpha = Math.min(1, edgeAlpha * 2);
           } else {
              edgeAlpha *= 0.1;
           }
        }
        ctx.globalAlpha = edgeAlpha;
        
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      for (const n of nodes) {
        let isFocusedNode = previewFocalNode && previewFocalNode.id === n.id;
        let isDimmed = previewFocalNode && !inClusterIds.has(n.id);
        
        ctx.globalAlpha = isDimmed ? 0.2 : 1.0;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI);
        
        ctx.shadowColor = themeColors.shadowD;
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        ctx.fillStyle = getGradientColor(n.score);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        const grad = ctx.createLinearGradient(n.x - n.radius, n.y - n.radius, n.x + n.radius, n.y + n.radius);
        grad.addColorStop(0, themeColors.gradL);
        grad.addColorStop(1, themeColors.gradD);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = isFocusedNode ? 3 : 1;
        ctx.strokeStyle = isFocusedNode ? '#ffffff' : (hoveredNode && hoveredNode.id === n.id ? '#ffffff' : themeColors.shadowD);
        ctx.stroke();
        
        ctx.globalAlpha = 1.0;
      }
      
      ctx.restore();

      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      isRunning = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [dimensions, isSimulating, hoveredNode, themeColors, previewFocalNode, previewThreshold, previewMode, previewTopN]);

  const handleMouseClick = () => {
    if (hoveredNode && onGoToCard && !isDraggingRef.current) {
      onGoToCard(hoveredNode.originalIndex);
    }
  };

  return (
    <div className="w-full h-[calc(100dvh-200px)] animate-fade-in flex flex-col">
      <div className="neu-panel p-4 sm:p-8 flex-1 flex flex-col relative">
        <div className="flex justify-between items-center mb-4 z-10 relative pointer-events-none">
          <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] flex items-center uppercase tracking-widest">
            <ActivityIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> 
            {t.knowledgeGraphTitle || "Neuro-Map"}
          </h2>
          <div className="flex items-center space-x-2 sm:space-x-4 pointer-events-auto">
            <div className="flex flex-col items-end">
               <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                 <span className="hidden sm:inline">Clustering: </span>Top {Math.round((1 - clusterThreshold) * 100)}%
               </label>
               <input 
                 type="range" 
                 min="0.50" 
                 max="0.98" 
                 step="0.01" 
                 value={clusterThreshold} 
                 onChange={(e) => setClusterThreshold(parseFloat(e.target.value))}
                 className="w-20 sm:w-32 accent-[var(--accent)] opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                 title={`Set the threshold for semantic clustering. Currently keeping the top ${Math.round((1 - clusterThreshold) * 100)}% of links.`}
               />
            </div>
            <button 
               onClick={() => {
                 if (onRecalculate) onRecalculate();
                 initSimulation();
               }} 
               className="neu-btn p-2 sm:px-4 sm:py-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)] rounded-lg flex items-center"
            >
              <RefreshIcon className="sm:mr-2" /> <span className="hidden sm:inline">{t.recenter || "Recalculate"}</span>
            </button>
          </div>
        </div>

        <div ref={wrapperRef} className="relative flex-1 rounded-xl overflow-hidden cursor-crosshair">
          {deck && deck.some(q => !cardEmbeddings[q.id]) && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--bg-main)] bg-opacity-80 backdrop-blur-sm rounded-2xl">
              <NetworkIcon className="text-4xl text-[var(--accent)] mb-4 animate-pulse" />
              <h3 className="text-xl font-black uppercase tracking-widest text-[var(--text-main)] mb-2">
                {t.analyzing || "Analyzing Context..."}
              </h3>
              <p className="text-[var(--text-muted)] text-sm mb-6 max-w-md text-center">
                {t.generatingEmbeddingsDesc || "Generating neural embeddings for your knowledge graph. This only happens once."}
              </p>
              <div className="w-64 h-3 bg-black/20 dark:bg-white/10 rounded-full overflow-hidden relative border border-white/5 shadow-inner">
                 <div 
                   className={`absolute left-0 top-0 bottom-0 bg-[var(--accent)] rounded-full ${embeddingStatus === "ready" ? "w-full animate-indeterminate opacity-80" : "transition-all duration-300"}`}
                   style={embeddingStatus === "loading" ? { width: `${embeddingProgress || 0}%` } : {}}
                 ></div>
                 <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
              </div>
              <div className="mt-2 text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase">
                {embeddingStatus === "loading" ? `${t.downloadingAiModel || "Downloading AI Model..."} ${embeddingProgress}%` : (t.extractingData || "Extracting Data...")}
              </div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            {...handlers}
            onDoubleClick={handleMouseClick}
            className="w-full h-full touch-none"
          />
          
          {hoveredNode && !isDraggingRef.current && (
            <div 
              className="absolute pointer-events-none neu-panel p-4 z-20 max-w-sm sm:max-w-md"
              style={{
                left: Math.min(mousePos.x + 15, dimensions.width - 320),
                top: Math.min(mousePos.y + 15, dimensions.height - 120)
              }}
            >
              <div className="text-[10px] font-black uppercase tracking-widest mb-2 text-[var(--text-muted)] flex items-center justify-between">
                 <span>{t.cardLabel || "Card"}</span>
                 <span style={{ color: getGradientColor(hoveredNode.score) }}>
                    {hoveredNode.score}/10
                 </span>
              </div>
              <p className="text-sm font-medium text-[var(--text-main)] leading-relaxed">
                {hoveredNode.question}
              </p>
            </div>
          )}

          <GraphPreviewPanel 
            previewFocalNode={previewFocalNode}
            setPreviewFocalNode={setPreviewFocalNode}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            previewThreshold={previewThreshold}
            setPreviewThreshold={setPreviewThreshold}
            previewTopN={previewTopN}
            setPreviewTopN={setPreviewTopN}
            cardEmbeddings={cardEmbeddings}
            deck={deck}
            t={t}
            setFocusMode={setFocusMode}
            onStartFocusStudy={onStartFocusStudy}
          />
        </div>
      </div>
    </div>
  );
};

