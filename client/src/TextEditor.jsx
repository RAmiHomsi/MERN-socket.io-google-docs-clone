import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import Quill styles
import { io } from "socket.io-client";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["clean"],
  ],
};

export default function TextEditor() {
  const [socket, setSocket] = useState();
  const [editorState, setEditorState] = useState("");
  const [readOnly, setReadOnly] = useState(true);
  const quillRef = useRef();
  const { id: documentId } = useParams();

  //connect to server
  useEffect(() => {
    const s = io("http://localhost:5000");
    setSocket(s);

    //unmount the connection after it is established
    return () => {
      s.disconnect();
    };
  }, []);

  //fetches user document identified by documentId from the server
  useEffect(() => {
    if (socket == null) return;
    socket.once("load-document", (document) => {
      setEditorState(document);
      setReadOnly(false);
    });
    socket.emit("get-document", documentId);
  }, [socket, documentId]);

  //handle received data
  useEffect(() => {
    if (socket == null) return;
    const handler = (delta) => {
      quillRef.current.getEditor().updateContents(delta);
    };
    socket.on("received-delta", handler);
    return () => {
      socket.off("received-delta", handler);
    };
  }, [socket]);

  //sets up an interval to periodically save the document content to the server.
  useEffect(() => {
    if (socket == null) return;
    const interval = setInterval(() => {
      socket.emit("save-document", quillRef.current.getEditor().getContents());
    }, 2000);
    return () => {
      clearInterval(interval);
    };
  }, [socket]);

  //These parameters are provided by the react-quill library when the content of the editor changes.
  //changes: can be any name ex. content. This is the HTML content of the editor.
  //delta:The changes made to the content in Delta format (Quill's format for representing rich text changes).
  //source: The source of the change, whether it was triggered by the user or programmatically.
  const handleTextChange = (changes, delta, source, editor) => {
    setEditorState(changes);
    if (source !== "user") return;
    socket.emit("send-delta", delta);
  };

  return (
    <div className="container">
      <ReactQuill
        ref={quillRef}
        theme={"snow"}
        modules={modules}
        readOnly={readOnly}
        value={editorState}
        onChange={handleTextChange}
      />
    </div>
  );
}
