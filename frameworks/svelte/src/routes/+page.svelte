<script lang="ts">
import { Button } from 'shadcn/button';
import * as Card from 'shadcn/card';
import { Input } from 'shadcn/input';
import { Label } from 'shadcn/label';
import * as v from 'valibot';
import { z } from 'zod/v4';
import { Form } from '$lib';

type Issues = string[];

// eslint-disable-next-line
const zSchema = z.object({
	// `form` isn't needed here, this is to demonstrate how to access nested fields
	account: z.object({
		emails: z.array(z.email().trim().min(10, '10 characters minimum')),
		password: z.string().min(8, '8 characters minimum').max(32, '32 characters maximum'),
	}),

	rememberMe: z.boolean(),
});

const vSchema = v.object({
	account: v.object({
		emails: v.array(
			v.pipe(v.string(), v.email(), v.trim(), v.minLength(10, '10 characters minimum'))
		),
		password: v.pipe(
			v.string(),
			v.minLength(8, '8 characters minimum'),
			v.maxLength(32, '32 characters maximum')
		),
	}),

	rememberMe: v.boolean(),
});

// you may swap `vSchema` with `zSchema` and it'll work just the same
const form = new Form(vSchema, {
	initialValues: {
		rememberMe: false,
		account: {
			emails: [''],
			password: '',
		},
	},
});

const { field, setDirty } = form.methods();

setDirty(['account', 'emails'], [false]);
// $inspect();
</script>

<Card.Root class="w-md mx-auto">
	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Enter your email below to login to your account</Card.Description>
	</Card.Header>

	<Card.Content>
		<form class="grid gap-4">
			<div class="grid gap-2">
				<Label for="emails">Emails</Label>
				<Input
					{...field(['account', 'emails']).props}
					id="emails"
					type="email"
					placeholder="m@example.com"
					bind:value={form.fields.account.emails}
				/>
				{@render errors(field(['account', 'emails']).issues)}
			</div>

			<div class="grid gap-2">
				<Label for="password">Password</Label>
				<Input
					{...field(['account', 'password']).props}
					id="password"
					type="password"
					bind:value={form.fields.account.password}
					required
				/>
				{@render errors(field(['account', 'password']).issues)}
			</div>

			<div class="">
				<input type="checkbox" oninput={(e) => console.log(e)} />
			</div>

			<Button type="submit" class="w-full" disabled={!form.isValid}>Login</Button>
		</form>
	</Card.Content>
</Card.Root>

{#snippet errors(issues: Issues)}
	<div class="text-muted-foreground flex flex-col gap-0.5 text-sm">
		{#each issues as issue (issue)}
			<p class="text-destructive">{issue}</p>
		{/each}
	</div>
{/snippet}
