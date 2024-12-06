'use server';

import { z } from 'zod';
import { db } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
	id: z.string(),
	customerId: z.string(),
	amount: z.coerce.number(),
	status: z.enum(['paid', 'pending']),
	date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
	// const rawFormData = Object.fromEntries(formData.entries());
	const { customerId, amount, status } = CreateInvoice.parse(Object.fromEntries(formData.entries()));
	const amountInCents = amount * 100;
	const date = new Date().toISOString().split('T')[0];

	const client = await db.connect();
	try {
		await client.sql`
			INSERT INTO invoices (customer_id, amount, status, date)
			VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
		`;
		client.release();
	} catch (error) {
		console.error('Database Error:', error);
    throw new Error('Failed to create invoice.');
	}

	revalidatePath('/dashboard/invoices');
	redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse(Object.fromEntries(formData.entries()));

	const amountInCents = amount * 100;
	
	try {
		const client = await db.connect();
		
		await client.sql`
			UPDATE invoices
			SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
			WHERE id = ${id}
		`;
	
		client.release();

	} catch (error) {
		console.error('Database Error:', error);
    throw new Error('Failed to update invoice.');	
	}

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
	try {
		const client = await db.connect();
		await client.sql`DELETE FROM invoices WHERE id = ${id}`;
		client.release();
	} catch (error) {
		console.error('Database Error:', error);
    throw new Error('Failed to delete invoice.');
	}

  revalidatePath('/dashboard/invoices');
}