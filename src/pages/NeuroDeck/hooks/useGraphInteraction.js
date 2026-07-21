import { useRef, useState, useCallback, useEffect } from 'react';

const isMobile = typeof navigator !== 'undefined' && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2));

export const useGraphInteraction = (canvasRef, nodesRef, setPreviewFocalNode) => {
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  
  const isDraggingRef = useRef(false);
  const isMultiTouchRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const clickStartRef = useRef({ x: 0, y: 0 });

  const lastPinchDistRef = useRef(null);
  const lastPinchCenterRef = useRef(null);

  const getClientPos = useCallback((e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  }, []);

  const getNodeAtClientPos = useCallback((clientX, clientY) => {
    if (!canvasRef.current || !nodesRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const worldX = (mouseX - cameraRef.current.x) / cameraRef.current.scale;
    const worldY = (mouseY - cameraRef.current.y) / cameraRef.current.scale;

    for (const n of nodesRef.current) {
      const dx = n.x - worldX;
      const dy = n.y - worldY;
      // Allow a generous hit area on mobile touch so tapping nodes is effortless
      const hitMultiplier = isMobile ? 2.5 : 2.0;
      if (dx * dx + dy * dy < (n.radius * hitMultiplier) * (n.radius * hitMultiplier)) {
        return n;
      }
    }
    return null;
  }, [canvasRef, nodesRef]);

  const handlePointerDown = useCallback((e) => {
    if (e.touches && e.touches.length > 1) {
      setHoveredNode(null);
      isMultiTouchRef.current = true;
      clickStartRef.current = null;
      isDraggingRef.current = false;
      return;
    }
    
    if (!e.touches || e.touches.length === 1) {
      isMultiTouchRef.current = false;
    }

    const { clientX, clientY } = getClientPos(e);
    if (clientX === undefined) return;
    
    clickStartRef.current = { x: clientX, y: clientY };
    dragStartRef.current = { x: clientX, y: clientY };
    
    const targetNode = getNodeAtClientPos(clientX, clientY);
    if (!targetNode) {
      isDraggingRef.current = true;
    }
  }, [getClientPos, getNodeAtClientPos]);

  const handlePointerMove = useCallback((e) => {
    if (!canvasRef.current) return;
    const { clientX, clientY } = getClientPos(e);
    if (clientX === undefined) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    setMousePos({ x: mouseX, y: mouseY });

    if (isDraggingRef.current) {
      cameraRef.current.x += clientX - dragStartRef.current.x;
      cameraRef.current.y += clientY - dragStartRef.current.y;
      dragStartRef.current = { x: clientX, y: clientY };
    }

    // Only update hover node state on desktop (mobile has no hover)
    if (!isMobile) {
      const worldX = (mouseX - cameraRef.current.x) / cameraRef.current.scale;
      const worldY = (mouseY - cameraRef.current.y) / cameraRef.current.scale;

      let found = null;
      if (nodesRef.current) {
         for (const n of nodesRef.current) {
           const dx = n.x - worldX;
           const dy = n.y - worldY;
           if (dx * dx + dy * dy < (n.radius * 2) * (n.radius * 2)) {
             found = n;
             break;
           }
         }
      }
      
      setHoveredNode(found);
      if (canvasRef.current) {
         canvasRef.current.style.cursor = isDraggingRef.current ? 'grabbing' : (found ? 'pointer' : 'grab');
      }
    }
  }, [canvasRef, nodesRef, getClientPos]);

  const handlePointerUp = useCallback((e) => {
    const { clientX, clientY } = getClientPos(e);
    if (clientX !== undefined && clickStartRef.current && !isMultiTouchRef.current) {
      const dx = clientX - clickStartRef.current.x;
      const dy = clientY - clickStartRef.current.y;
      
      // If movement was small, treat as a true click/tap
      if (Math.sqrt(dx*dx + dy*dy) < 8) {
        const clickedNode = getNodeAtClientPos(clientX, clientY);
        setPreviewFocalNode(clickedNode);
      }
    }
    isDraggingRef.current = false;
    clickStartRef.current = null;
  }, [getNodeAtClientPos, setPreviewFocalNode, getClientPos]);

  const handlePointerLeave = useCallback(() => {
    isDraggingRef.current = false;
    setHoveredNode(null);
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    if (!canvasRef.current) return;
    if (e.touches && e.touches.length >= 2) {
      setHoveredNode(null);
      isMultiTouchRef.current = true;
      clickStartRef.current = null;
      isDraggingRef.current = false;

      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const pinchX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const pinchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      if (lastPinchDistRef.current !== null && lastPinchCenterRef.current) {
        const zoom = dist / lastPinchDistRef.current;
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = pinchX - rect.left;
        const mouseY = pinchY - rect.top;

        cameraRef.current.x = mouseX - (mouseX - cameraRef.current.x) * zoom;
        cameraRef.current.y = mouseY - (mouseY - cameraRef.current.y) * zoom;
        cameraRef.current.scale *= zoom;

        cameraRef.current.x += pinchX - lastPinchCenterRef.current.x;
        cameraRef.current.y += pinchY - lastPinchCenterRef.current.y;
      }
      lastPinchDistRef.current = dist;
      lastPinchCenterRef.current = { x: pinchX, y: pinchY };
      return;
    }
    
    handlePointerMove(e);
  }, [canvasRef, handlePointerMove]);
  
  const handleTouchEnd = useCallback((e) => {
    lastPinchDistRef.current = null;
    lastPinchCenterRef.current = null;
    
    if (!isMultiTouchRef.current && e && e.changedTouches && e.changedTouches.length === 1 && (!e.touches || e.touches.length === 0)) {
       handlePointerUp(e);
    } else {
       isDraggingRef.current = false;
       clickStartRef.current = null;
    }

    if (!e.touches || e.touches.length === 0) {
       isMultiTouchRef.current = false;
    }
  }, [handlePointerUp]);

  // Non-passive wheel handler directly bound to canvas to prevent browser window scrolling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoom = Math.exp(-e.deltaY * 0.002);
      
      cameraRef.current.x = mouseX - (mouseX - cameraRef.current.x) * zoom;
      cameraRef.current.y = mouseY - (mouseY - cameraRef.current.y) * zoom;
      cameraRef.current.scale = Math.min(Math.max(0.2, cameraRef.current.scale * zoom), 5);
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [canvasRef]);

  // Center camera helper
  const centerCamera = useCallback((dimensions) => {
    cameraRef.current = { x: dimensions.width / 2, y: dimensions.height / 2, scale: 1 };
  }, []);

  return {
    cameraRef,
    mousePos,
    hoveredNode,
    isDraggingRef,
    centerCamera,
    handlers: {
      onMouseMove: handlePointerMove,
      onMouseDown: handlePointerDown,
      onMouseUp: handlePointerUp,
      onMouseLeave: handlePointerLeave,
      onTouchMove: handleTouchMove,
      onTouchStart: handlePointerDown,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    }
  };
};
