import { useGraphInteraction } from "../hooks/useGraphInteraction";
import { GraphPreviewPanel } from "./GraphPreviewPanel";
import React, { useEffect, useRef, useState } from 'react';
import { cosineSimilarity } from '../../../utilities/shared';
import { ActivityIcon, RefreshIcon, NetworkIcon } from './Icons';

export const KnowledgeGraphView = ({ deck, myDecks, cardEmbeddings, t, onGoToCard, embeddingStatus, embeddingProgress, lastLogMessage, modelError, onRecalculate, focusMode, setFocusMode, onStartFocusStudy }) => {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const animationRef = useRef(null);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isSimulating, setIsSimulating] = useState(true);
  const [clusterThreshold, setClusterThreshold] = useState(0.50);
  const [previewFocalNode, setPreviewFocalNode] = useState(null);
  const [previewMode, setPreviewMode] = useState(focusMode?.mode || 'threshold');
  const [previewThreshold, setPreviewThreshold] = useState(focusMode?.threshold !== undefined ? focusMode.threshold : 0.85);
  const [previewTopN, setPreviewTopN] = useState(focusMode?.topN || 5);

  const nodesRef = useRef([]);
  const edgesRef = useRef([]);

  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const startTimeRef = useRef(null);
  const initialEmbeddedRef = useRef(null);

  const getCardId = (q, idx) => (q && (q.id !== undefined && q.id !== null) ? String(q.id) : (q._id || q.question || `card_${idx}`));

  const missingCardsCount = React.useMemo(() => {
    if (!deck || !cardEmbeddings) return 0;
    return deck.filter((q, idx) => cardEmbeddings[getCardId(q, idx)] === undefined).length;
  }, [deck, cardEmbeddings]);

  useEffect(() => {
    if (missingCardsCount === 0) {
      setSecondsRemaining(null);
      startTimeRef.current = null;
      initialEmbeddedRef.current = null;
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      initialEmbeddedRef.current = missingCardsCount;
      const initialEst = Math.max(1, Math.ceil(missingCardsCount * 0.15));
      setSecondsRemaining(initialEst);
    } else {
      const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
      const processed = (initialEmbeddedRef.current || missingCardsCount) - missingCardsCount;
      if (processed > 0) {
        const ratePerCard = elapsedSec / processed;
        const dynamicRemaining = Math.max(1, Math.ceil(missingCardsCount * ratePerCard));
        setSecondsRemaining(dynamicRemaining);
      }
    }
  }, [missingCardsCount]);

  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 1) return;
    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev && prev > 1 ? prev - 1 : 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const { cameraRef, mousePos, hoveredNode, isDraggingRef, handlers } = useGraphInteraction(canvasRef, nodesRef, setPreviewFocalNode);

  const REPULSION = 300;
  const SPRING_LENGTH = 150;
  const SPRING_STRENGTH = 0.02;
  const DAMPING = 0.70;
  const SIMILARITY_THRESHOLD = 0.3; 

  const initSimulation = () => {
    if (!deck || deck.length === 0 || !cardEmbeddings) return;

    const GOLDEN_ANGLE = 137.507764 * (Math.PI / 180);
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    const spacing = Math.min(dimensions.width, dimensions.height) / (2.5 * Math.sqrt(deck.length || 1));

    const nodes = deck.map((q, index) => {
      const angle = index * GOLDEN_ANGLE;
      const radius = Math.sqrt(index + 1) * spacing;
      return {
        id: q.id,
        originalIndex: index,
        question: q.question,
        score: q.isMastered ? 10 : (q.score || 0),
        subgroup: (q._sourceDeckId && myDecks ? myDecks.find(d => d.id === q._sourceDeckId)?.name : null) || q.subgroup || q.category || q.deckId || null,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        radius: 8 + (q.attempts > 0 ? 4 : 0),
        attempts: q.attempts || 0,
        embedding: cardEmbeddings[q.id]
      };
    });

    const numNodes = nodes.length;
    let globalMax = -Infinity;
    let globalMin = Infinity;
    const pairSims = new Map();

    // Single-Pass Symmetric Matrix Computation O(N^2 / 2) instead of redundant 2x O(N^2)
    for (let i = 0; i < numNodes; i++) {
      const n1 = nodes[i];
      if (!n1.embedding) continue;
      for (let j = i + 1; j < numNodes; j++) {
        const n2 = nodes[j];
        if (!n2.embedding) continue;
        const sim = cosineSimilarity(n1.embedding, n2.embedding);
        pairSims.set(`${i}_${j}`, sim);
        if (sim > globalMax) globalMax = sim;
        if (sim < globalMin) globalMin = sim;
      }
    }

    const range = (globalMax - globalMin) || 1;
    const edgesMap = new Map();

    // Build edges reusing precomputed symmetric similarity matrix
    for (let i = 0; i < numNodes; i++) {
      const n1 = nodes[i];
      if (!n1.embedding) continue;
      const nodeEdges = [];

      for (let j = 0; j < numNodes; j++) {
        if (i === j) continue;
        const n2 = nodes[j];
        if (!n2.embedding) continue;

        const sim = i < j ? pairSims.get(`${i}_${j}`) : pairSims.get(`${j}_${i}`);
        if (sim !== undefined) {
          const normalizedWeight = (sim - globalMin) / range;
          nodeEdges.push({ source: n1, target: n2, weight: normalizedWeight, rawSim: sim });
        }
      }

      nodeEdges.sort((a, b) => b.weight - a.weight);

      const topEdges = nodeEdges.filter((e, idx) => idx < 2 || e.weight >= clusterThreshold);
      topEdges.forEach(e => {
        const key = e.source.id < e.target.id ? `${e.source.id}-${e.target.id}` : `${e.target.id}-${e.source.id}`;
        if (!edgesMap.has(key)) {
          edgesMap.set(key, e);
        }
      });
    }

    const edges = Array.from(edgesMap.values());

    nodesRef.current = nodes;
    edgesRef.current = edges;
    cameraRef.current = { x: 0, y: 0, scale: 1 };
    
    if (focusMode?.active && focusMode?.focalNodeId) {
      const initialFocal = nodes.find(n => n.id === focusMode.focalNodeId);
      if (initialFocal) {
        setPreviewFocalNode(initialFocal);
        if (focusMode.mode) setPreviewMode(focusMode.mode);
        if (focusMode.threshold !== undefined) setPreviewThreshold(focusMode.threshold);
        if (focusMode.topN !== undefined) setPreviewTopN(focusMode.topN);
      }
    }

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
    colorGood: [52, 211, 153],
    colorMastered: [168, 85, 247]
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

  const getPastelColor = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
         hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const h = Math.abs(hash) % 360;
      return `hsl(${h}, 85%, 75%)`;
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
          const n1 = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = n1.x - n2.x;
            const dy = n1.y - n2.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > 90000 || distSq < 0.01) continue; // Cutoff repulsion beyond 300px

            const dist = Math.sqrt(distSq);
            const force = REPULSION / distSq;
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

        if (n.subgroup) {
          ctx.lineWidth = isFocusedNode ? 3 : (hoveredNode && hoveredNode.id === n.id ? 2.5 : 2);
          ctx.strokeStyle = isFocusedNode ? '#ffffff' : (hoveredNode && hoveredNode.id === n.id ? '#ffffff' : getPastelColor(n.subgroup));
        } else {
          ctx.lineWidth = isFocusedNode ? 3 : 1;
          ctx.strokeStyle = isFocusedNode ? '#ffffff' : (hoveredNode && hoveredNode.id === n.id ? '#ffffff' : themeColors.shadowD);
        }
        ctx.stroke();

        // Pulsing weakness halo for cards with failed attempts (score 0 with attempts > 0)
        const isWeakNode = n.score === 0 && (n.attempts || 0) > 0;
        if (isWeakNode && !isDimmed) {
          const pulse = Math.sin(Date.now() * 0.004 + n.originalIndex * 1.5) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 3 + pulse * 2.5, 0, 2 * Math.PI);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.45 + pulse * 0.4})`;
          ctx.stroke();
        }
        
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

  const isMobile = typeof navigator !== 'undefined' && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2));

  return (
    <div className="w-full h-[calc(100dvh-160px)] min-h-[400px] max-h-[850px] animate-fade-in flex flex-col">
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
                 min="0.00" 
                 max="0.99" 
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
          {deck && deck.some((q, idx) => cardEmbeddings[getCardId(q, idx)] === undefined) && (() => {
            const embeddedCount = deck.filter((q, idx) => cardEmbeddings[getCardId(q, idx)] !== undefined).length;
            const remainingCount = deck.length - embeddedCount;
            const displaySec = (secondsRemaining !== null && secondsRemaining !== undefined) ? secondsRemaining : Math.max(1, Math.ceil(remainingCount * 0.12));
            const comeBackMsg = (t.comeBackInSeconds || "Come back in ~{seconds} seconds").replace('{seconds}', displaySec);

            return (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--bg-main)] bg-opacity-85 backdrop-blur-md rounded-2xl p-6 transition-all duration-300">
                <NetworkIcon className="text-5xl text-[var(--accent)] mb-4 animate-pulse" />
                <h3 className="text-xl font-black uppercase tracking-widest text-[var(--text-main)] mb-2 text-center">
                  {t.analyzing || "Analyzing Context..."}
                </h3>
                <p className="text-[var(--text-muted)] text-sm mb-4 max-w-md text-center">
                  {t.generatingEmbeddingsDesc || "Generating neural embeddings for your knowledge graph. This only happens once."}
                </p>

                <div className="w-72 sm:w-80 h-3.5 bg-black/30 dark:bg-white/10 rounded-full overflow-hidden relative border border-white/10 shadow-inner">
                   <div 
                     className="absolute left-0 top-0 bottom-0 bg-[var(--accent)] rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                     style={{
                       width: embeddingStatus === "loading"
                         ? `${Math.max(5, embeddingProgress || 0)}%`
                         : `${Math.max(8, Math.round((embeddedCount / deck.length) * 100))}%`
                     }}
                   ></div>
                   <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                </div>

                <div className="mt-3 text-xs font-bold text-[var(--accent)] tracking-widest uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping"></span>
                  {embeddingStatus === "error"
                    ? `⚠️ Model Error`
                    : embeddingStatus === "loading"
                    ? `${t.downloadingAiModel || "Downloading AI Model..."} ${embeddingProgress || 0}%`
                    : `${t.extractingData || "Extracting Knowledge Vector Features..."} (${embeddedCount} / ${deck.length})`}
                </div>

                {lastLogMessage && (
                  <div className="mt-2 text-[11px] font-mono text-[var(--text-muted)] opacity-90 px-3 py-1 bg-black/20 rounded-md max-w-sm text-center truncate" title={lastLogMessage}>
                    💬 {lastLogMessage}
                  </div>
                )}

                {embeddingStatus === "error" && modelError && (
                  <div className="mt-2 text-[11px] font-mono text-red-400 bg-red-950/40 p-2 rounded-md max-w-sm text-center border border-red-500/30">
                    ❌ {modelError}
                  </div>
                )}

                {embeddingStatus !== "loading" && embeddingStatus !== "error" && (
                  <p className="mt-2 text-xs font-bold text-[var(--text-muted)] opacity-90 tracking-wider">
                    ⏱️ {comeBackMsg}
                  </p>
                )}
              </div>
            );
          })()}
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            {...handlers}
            onDoubleClick={handleMouseClick}
            className="w-full h-full touch-none"
          />
          
          {hoveredNode && !isMobile && !isDraggingRef.current && (
            <div 
              className="absolute pointer-events-none neu-panel p-4 z-20 max-w-sm sm:max-w-md"
              style={{
                left: Math.min(mousePos.x + 15, dimensions.width - 320),
                top: Math.min(mousePos.y + 15, dimensions.height - 120)
              }}
            >
              <div className="text-[10px] font-black uppercase tracking-widest mb-2 text-[var(--text-muted)] flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <span>{t.cardLabel || "Card"}</span>
                   {hoveredNode.subgroup && (
                     <span className="px-2 py-0.5 rounded-md truncate max-w-[120px]" style={{ backgroundColor: getPastelColor(hoveredNode.subgroup), color: 'rgba(0,0,0,0.7)' }}>
                       {hoveredNode.subgroup}
                     </span>
                   )}
                 </div>
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

