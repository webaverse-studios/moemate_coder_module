const React = window.react;

export const IframeWrapper = () => {
  const [isOpen, setOpen] = React.useState(false);
  window.setOpen = setOpen
  const [iframeUrl, setIframeUrl] = React.useState('https://localhost:8080/d/test/error_handle/index.html');

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

    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, []);

  return (
    <div>
      <div className="iframe-container">
        <div className="close-button" onClick={closeIframe}>&#10006;</div>
        <iframe src={iframeUrl}></iframe>
      </div>
    </div>
  );
}