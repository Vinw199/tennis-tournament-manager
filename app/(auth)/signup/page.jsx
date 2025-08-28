import { signup } from '../actions';
import SignupForm from './SignupForm';

import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default async function SignupPage({ searchParams }) {
  const { error } = await searchParams;

  return (
    <Card className="py-8 px-1">
      <CardHeader>
        <div className="text-center relative flex flex-col items-center">
          {/* <img
            src="/logo.png"
            alt="App Logo"
            className="h-12 w-auto absolute -translate-x-30"
          /> */}
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-sm text-muted-foreground">Join the club</p>
        </div>
      </CardHeader>
      <CardContent>
        <SignupForm signup={signup} error={error} />
      </CardContent>
    </Card>
  );
}