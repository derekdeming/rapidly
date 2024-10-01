'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  email: z.string().min(2, {
    message: 'Email must be at least 2 characters.',
  }),
  password: z.string().min(2, {
    message: 'Password must be at least 2 characters.',
  }),
});

export function CredentialsForm() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="hello@tryrapidly.com" {...field} />
              </FormControl>
              {/* <FormDescription>This is your public display name.</FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="•••••••••" type='password' {...field} />
              </FormControl>
              {/* <FormDescription>This is your public display name.</FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}

// import { FormEventHandler, useState } from 'react';

// interface CredentialsFormProps {
//   csrfToken?: string;
// }

// export function CredentialsForm(props: CredentialsFormProps) {
//   const router = useRouter();
//   const [error, setError] = useState<string | null>(null);

//   const handleSubmit: FormEventHandler = async (e: any) => {
//     e.preventDefault();
//     const data = new FormData(e.currentTarget); // check type

//     const signInResponse = await signIn("credentials", {
//         email: data.get("email"),
//         password: data.get("password"),
//         redirect: false,
//     })

//     if (signInResponse && !signInResponse.error) {
//         router.push("/dashboard");
//     }
//     else {
//         console.log("Error: ", signInResponse);
//         setError("Invalid credentials");
//     }

//   };

//   return (
//     <form
//       className="w-full mt-8 text-xl text-black font-semibold flex flex-col"
//       onSubmit={handleSubmit}
//     >
//       {error && (
//         <span className="p-4 mb-2 text-lg font-semibold text-white bg-red-500 rounded-md">
//           {error}
//         </span>
//       )}
//       <input
//         type="email"
//         name="email"
//         placeholder="Email"
//         required
//         className="w-full px-4 py-4 mb-4 border border-gray-300 rounded-md"
//       />

//       <input
//         type="password"
//         name="password"
//         placeholder="Password"
//         required
//         className="w-full px-4 py-4 mb-4 border border-gray-300 rounded-md"
//       />

//       <button type="submit" className="w-full h-12 px-6 mt-4 text-lg text-white">
//         Log In
//       </button>
//     </form>
//   );
// }
