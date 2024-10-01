import { GoogleSignInButton } from '@/components/auth-buttons/google-auth-button';
import { CredentialsForm } from '@/components/credentialsForm';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Page() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        {/* <CardDescription>Deploy your new project in one-click.</CardDescription> */}
      </CardHeader>
      <CardContent>
        <div className="flex justify-center items-center">
          <GoogleSignInButton />
        </div>
        <div className="text-center py-3">
          <span className="text-xs font-semibold text-center mt-8">Or</span>
        </div>
        <CredentialsForm />
      </CardContent>
      {/* <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter> */}
    </Card>
  );
}
