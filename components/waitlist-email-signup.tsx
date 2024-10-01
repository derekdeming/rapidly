'use client';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { FormEvent, useState } from 'react';

export function WaitlistEmailSignup() {
  const [email, setEmail] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email) return;
    try {
      await axios.post('/api/util/waitlist', { email: email });
      setSubmitted(true);
    } catch (err) {
      console.log(err);
    }
  };

  if (submitted) return <div>Thanks for signing up!</div>;

  return (
    <form className="flex flex-row" onSubmit={onSubmit}>
      <Input
        className="mr-2"
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button className="w-60">Request Access</Button>
    </form>
  );
}
