<script lang="ts">
import { Button } from 'shadcn/button';
import * as Card from 'shadcn/card';
import { Input } from 'shadcn/input';
import { Label } from 'shadcn/label';
import { z } from 'zod/v4';
import { RunedForm } from '$lib';

type Issues = string[];

const schema = z.object({
	// `form` isn't needed here, this is to demonstrate how to access nested fields
	form: z.object({
		email: z.email().min(10, '10 chars minimum').trim(),
		password: z.string().min(8, '8 chars minimum').max(32, '32 chars maximum'),
	}),
	rememberMe: z.boolean(),
});

const form = new RunedForm(schema, {
	initialValues: {
		rememberMe: false,
		form: {
			email: '',
			password: '',
		},
	},
});

const { field } = form.methods();

$inspect(form.issues);
</script>

<Card.Root class="mx-auto max-w-md">
	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Enter your email below to login to your account</Card.Description>
	</Card.Header>

	<Card.Content>
		<form class="grid gap-4">
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input
					{...field('form.email').props}
					id="email"
					type="email"
					placeholder="m@example.com"
					bind:value={form.fields.form.email}
				/>
				{@render errors(field('form.email').issues)}
			</div>

			<div class="grid gap-2">
				<Label for="password">Password</Label>
				<Input
					{...field('form.password').props}
					id="password"
					type="password"
					bind:value={form.fields.form.password}
					required
				/>
				{@render errors(field('form.password').issues)}
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
