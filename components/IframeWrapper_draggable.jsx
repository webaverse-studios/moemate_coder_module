const React = window.react;

export const IframeWrapper = () => {
  const [isOpen, setOpen] = React.useState(false);
  window.setCoderModuleIframeOpen = setOpen
  const [iframeUrl, setIframeUrl] = React.useState('about:blank');
  const iframeRef = React.useRef(null);

  const [dragging, setDragging] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  const closeIframe = () => {
    setOpen(false);
  };

  const handleMouseDown = (e) => {
    console.log('handleMouseDown');
    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      console.log('handleMouseMove', dragging);
      if (!dragging) return;
      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    };
    const handleMouseUp = () => {
      console.log('handleMouseUp');
      setDragging(false);
    };
    // Attach global event listeners for mousemove and mouseup
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Remove event listeners when the component unmounts
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]); // Empty dependency array to run this effect only once

  return (
    isOpen && (
      <div
        className="iframe-container"
        style={{
          display: 'flex',
          zIndex: 9999,
          position: 'relative',
          left: position.x + 'px',
          top: position.y + 'px',
          width: '100vw',
          height: '50vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="close-button"
          onClick={closeIframe}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            cursor: 'pointer',
            color: 'white',
            fontSize: '20px',
          }}
        >
          &#10006;
        </div>
        <iframe
          id="CoderModuleIframe"
          ref={iframeRef}
          src={iframeUrl}
          style={{
            width: '90%',
            height: '90%',
            border: 'none',
            boxShadow: '0px 0px 10px rgba(255, 255, 255, 0.3)',
            background: 'gray',
            position: 'unset',
          }}
        ></iframe>
      </div>
    )
  );
};
