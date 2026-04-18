import { Router as WouterRouter, Route, Switch } from "wouter";
import Game from "@/pages/Game";

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Switch>
        <Route path="/" component={Game} />
      </Switch>
    </WouterRouter>
  );
}

export default App;
