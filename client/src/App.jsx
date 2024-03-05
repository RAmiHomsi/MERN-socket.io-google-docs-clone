import { Routes, Route, Navigate } from "react-router-dom";
import TextEditor from "./TextEditor";
import { v4 as uuidV4 } from "uuid";

function App() {
  return (
    <Routes>
      <Route path="/api/documents/:id" element={<TextEditor />} />
      <Route
        path="*"
        element={<Navigate to={`/api/documents/${uuidV4()}`} replace={true} />}
        //redirect new users to a new blank doc with unique id first time they have their own doc
        // replace prop prevents the current entry from being added to the history stack
      />
    </Routes>
  );
}
export default App;
