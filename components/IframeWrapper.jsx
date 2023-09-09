const React = window.react;

export const IframeWrapper = () => {
  const [isOpen, setOpen] = React.useState(false);
  window.setCoderModuleIframeOpen = setOpen
  const [iframeUrl, setIframeUrl] = React.useState('about:blank');
  const iframeRef = React.useRef(null);


  const openIframe = () => {
    setOpen(true);
  }

  const closeIframe = () => {
    setOpen(false);
  }
  
  const handleIframeMessage = (event) => {
    if (event.origin !== 'https://www.example.com') {
      return;
    }

    setIframeUrl(event.data.url);
  }

  React.useEffect(() => {
    window.addEventListener('message', handleIframeMessage);

    // var iframeDocument =iframeRef.current.contentDocument ||iframeRef.current.contentWindow.document;
    // iframeDocument.open();
    // iframeDocument.write(`<div>jjjkkk</div>`);
    // iframeDocument.close();
    // window.iframeDocument = iframeDocument // test

    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, []);

  return (
    (isOpen && <div className="iframe-container" style={{display: 'flex', zIndex: 9999, position: 'relative', left: 0, top: '-50vh', width: '100vw', height: '50vh',  flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)',}}>
      <div className="close-button" onClick={closeIframe} style={{ position: 'absolute', top: '10px', right: '10px', cursor: 'pointer', color: 'white', fontSize: '20px', }}>&#10006;</div>
      <iframe id="CoderModuleIframe" ref={iframeRef} src={iframeUrl} style={{ width: '90%', height: '90%', border: 'none', boxShadow: '0px 0px 10px rgba(255, 255, 255, 0.3)', background: 'gray', position: 'unset', }}></iframe>
    </div>)
  );
}