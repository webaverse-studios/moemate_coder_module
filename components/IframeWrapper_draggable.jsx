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
    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

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
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
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
