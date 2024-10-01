import { GoogleSignInButton } from '@/components/auth-buttons/google-auth-button';
import { CredentialsForm } from '@/components/credentialsForm';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SignInPage() {
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

// export default async function SignInPage() {
//   return (
//     <div className="w-full flex flex-col items-center justify-center min-h-screen py-2">
//       <div className="flex flex-col items-center w-1/3 mt-10 p-10 shadow-md">
//         <h1 className="mt-10 mb-4 text-4xl font-bold">Sign In</h1>
//         {/* <GoogleSignInButton/> */}
//         <span className="text-2xl font-semibold text-white text-center mt-8">Or</span>
//         <CredentialsForm />
//       </div>
//     </div>
//   );
// }
