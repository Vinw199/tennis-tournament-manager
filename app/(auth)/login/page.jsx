// This is your updated page file, e.g., app/login/page.jsx

import { login } from '../actions';
import LoginForm from './LoginForm';

import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default async function LoginPage({ searchParams }) {
  const { error, message } = await searchParams;

  return (
    <Card className="py-8 px-1">
      <CardHeader>
        <div className="text-center relative flex flex-col items-center">
          {/* <img
            src="/logo.png"
            alt="App Logo"
            className="h-12 w-auto absolute left-1/4"
          /> */}
          <h1 className="text-2xl font-bold">Log in</h1>
          <p className="text-sm text-muted-foreground">Welcome back</p>
        </div>
      </CardHeader>
      <CardContent>
        <LoginForm login={login} error={error} message={message} />
      </CardContent>
    </Card>
  );
}
