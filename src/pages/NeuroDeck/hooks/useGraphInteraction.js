import { useRef, useState, useCallback } from 'react';

export const useGraphInteraction = (canvasRef, nodesRef, setPreviewFocalNode) => {
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  
  const isDraggingRef = useRef(false);
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

  const handlePointerDown = useCallback((e) => {
    if (e.touches && e.touches.length > 1) {
      setHoveredNode(null);
      return;
    }
    const { clientX, clientY } = getClientPos(e);
    if (clientX === undefined) return;
    
    clickStartRef.current = { x: clientX, y: clientY };
    dragStartRef.current = { x: clientX, y: clientY };
    
    // Check if we clicked on empty space (hoveredNode is determined in pointerMove)
    if (!hoveredNode) {
      isDraggingRef.current = true;
    }
  }, [hoveredNode, getClientPos]);

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
  }, [canvasRef, nodesRef, getClientPos]);

  const handlePointerUp = useCallback((e) => {
    const { clientX, clientY } = getClientPos(e);
    if (clientX !== undefined && clickStartRef.current) {
      const dx = clientX - clickStartRef.current.x;
      const dy = clientY - clickStartRef.current.y;
      
      // If we haven't moved far from the ORIGINAL click point, it's a true click
      if (Math.sqrt(dx*dx + dy*dy) < 5) {
        if (hoveredNode) {
          setPreviewFocalNode(hoveredNode);
        } else {
          setPreviewFocalNode(null);
        }
      }
    }
    isDraggingRef.current = false;
    clickStartRef.current = null;
  }, [hoveredNode, setPreviewFocalNode, getClientPos]);

  const handlePointerLeave = useCallback(() => {
    isDraggingRef.current = false;
    setHoveredNode(null);
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    if (!canvasRef.current) return;
    if (e.touches && e.touches.length === 2) {
      setHoveredNode(null);
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
    
    // For single touch, we just delegate to pointerMove
    // We don't reset isDraggingRef falsely anymore
    handlePointerMove(e);
  }, [canvasRef, handlePointerMove]);
  
  const handleTouchEnd = useCallback((e) => {
    lastPinchDistRef.current = null;
    lastPinchCenterRef.current = null;
    
    // Only process as a click if it was a single touch ending
    if (e && e.changedTouches && e.changedTouches.length === 1 && e.touches.length === 0) {
       handlePointerUp(e);
    } else {
       isDraggingRef.current = false;
    }
  }, [handlePointerUp]);

  const handleWheel = useCallback((e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoom = Math.exp(-e.deltaY * 0.002);
    
    cameraRef.current.x = mouseX - (mouseX - cameraRef.current.x) * zoom;
    cameraRef.current.y = mouseY - (mouseY - cameraRef.current.y) * zoom;
    cameraRef.current.scale *= zoom;
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
      onWheel: handleWheel,
    }
  };
};
