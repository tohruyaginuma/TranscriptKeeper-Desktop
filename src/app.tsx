import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from "./components/ui/button"

const Main = () => {
    return (
        <>
        <h2>Hello from React!</h2>
        <Button onClick={()=>{console.log("hoge")}}>Record</Button>
        </>
    )
}

const root = createRoot(document.body);
root.render(<Main />);