import React, { useEffect, useRef, useState } from 'react';
import { cosineSimilarity } from '../../../utilities/shared';
import { ActivityIcon, RefreshIcon } from './Icons';

export const KnowledgeGraphView = ({ deck, cardEmbeddings, t }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  
  const [hoveredNode, setHoveredNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isSimulating, setIsSimulating] = useState(true);

  const REPULSION = 1000;
  const SPRING_LENGTH = 100;
  const SPRING_STRENGTH = 0.05;
  const DAMPING = 0.85;
  const SIMILARITY_THRESHOLD = 0.3; 

  const nodesRef = useRef([]);
  const edgesRef = useRef([]);

  const initSimulation = () => {
    if (!deck || deck.length === 0 || !cardEmbeddings) return;

    const nodes = deck.map(q => ({
      id: q.id,
      question: q.question,
      score: q.isMastered ? 10 : (q.score || 0),
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      vx: 0,
      vy: 0,
      radius: 8 + (q.attempts > 0 ? 4 : 0),
      embedding: cardEmbeddings[q.id]
    }));

    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        if (n1.embedding && n2.embedding) {
          const sim = cosineSimilarity(n1.embedding, n2.embedding);
          if (sim > SIMILARITY_THRESHOLD) {
            edges.push({ source: n1, target: n2, weight: sim });
          }
        }
      }
    }

    nodesRef.current = nodes;
    edgesRef.current = edges;
    setIsSimulating(true);
  };

  useEffect(() => {
    initSimulation();
  }, [deck, cardEmbeddings, dimensions]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
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
           const dist = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
           n.vx += (dx / dist) * 0.5;
           n.vy += (dy / dist) * 0.5;
        }

        for (const n of nodes) {
          n.vx *= DAMPING;
          n.vy *= DAMPING;
          n.x += n.vx;
          n.y += n.vy;
          
          n.x = Math.max(n.radius, Math.min(dimensions.width - n.radius, n.x));
          n.y = Math.max(n.radius, Math.min(dimensions.height - n.radius, n.y));

          totalVelocity += Math.abs(n.vx) + Math.abs(n.vy);
        }

        if (totalVelocity < 0.5 * nodes.length) {
          setIsSimulating(false); 
        }
      }

      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      ctx.lineWidth = 1;
      for (const edge of edges) {
        ctx.beginPath();
        ctx.moveTo(edge.source.x, edge.source.y);
        ctx.lineTo(edge.target.x, edge.target.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${edge.weight * 0.2})`;
        ctx.stroke();
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI);
        
        let color = '#a855f7'; 
        if (n.score === 10) color = '#10b981'; 
        else if (n.score <= 3) color = '#ef4444'; 
        else if (n.score <= 7) color = '#f97316'; 

        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = hoveredNode && hoveredNode.id === n.id ? '#ffffff' : 'rgba(0,0,0,0.5)';
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      isRunning = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [dimensions, isSimulating, hoveredNode]);

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let found = null;
    for (const n of nodesRef.current) {
      const dx = n.x - x;
      const dy = n.y - y;
      if (dx * dx + dy * dy < (n.radius * 2) * (n.radius * 2)) {
        found = n;
        break;
      }
    }
    setHoveredNode(found);
  };

  return (
    <div className="w-full h-full min-h-[500px] animate-fade-in flex flex-col">
      <div className="neu-panel p-4 sm:p-8 flex-1 flex flex-col relative" ref={containerRef}>
        <div className="flex justify-between items-center mb-4 z-10 relative pointer-events-none">
          <h2 className="text-lg sm:text-2xl font-black text-[var(--text-main)] flex items-center uppercase tracking-widest">
            <ActivityIcon className="mr-2 sm:mr-4 text-[var(--accent)] text-lg sm:text-2xl" /> 
            {t.knowledgeGraphTitle || "Neuro-Map"}
          </h2>
          <button 
             onClick={() => initSimulation()} 
             className="neu-btn px-4 py-2 pointer-events-auto text-xs font-bold uppercase tracking-widest text-[var(--accent)] rounded-lg flex items-center"
          >
            <RefreshIcon className="mr-2" /> {t.recenter || "Recalculate"}
          </button>
        </div>

        <div className="absolute inset-0 top-16 bottom-4 left-4 right-4 rounded-xl overflow-hidden cursor-crosshair">
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredNode(null)}
            className="w-full h-full touch-none"
          />
          
          {hoveredNode && (
            <div 
              className="absolute pointer-events-none neu-pressed p-3 rounded-lg z-20 max-w-xs shadow-xl border border-white/10"
              style={{
                left: Math.min(hoveredNode.x + 15, dimensions.width - 250),
                top: Math.min(hoveredNode.y + 15, dimensions.height - 100)
              }}
            >
              <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-[var(--text-muted)] flex items-center justify-between">
                 <span>{t.cardLabel || "Card"}</span>
                 <span style={{ color: hoveredNode.score === 10 ? '#10b981' : hoveredNode.score <= 3 ? '#ef4444' : hoveredNode.score <= 7 ? '#f97316' : '#a855f7' }}>
                    {hoveredNode.score}/10
                 </span>
              </div>
              <p className="text-xs font-medium text-[var(--text-main)] leading-relaxed">
                {hoveredNode.question}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
