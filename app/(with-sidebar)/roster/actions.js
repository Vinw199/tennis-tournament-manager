'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const ROSTER_PATH = '/roster';

export async function savePlayer(prevState, formData) {
    const supabase = await createClient();

    const id = formData.get('id');
    const rawData = {
        name: formData.get('name'),
        default_skill_rank: Number(formData.get('rank')),
        age: formData.get('age') ? Number(formData.get('age')) : null,
        gender: formData.get('gender') || null,
        profile_picture_url: formData.get('profile_picture_url') || null,
    };

    let successMessage = '';
    if (id) {
        // Update logic
        const { error } = await supabase.from('players').update(rawData).eq('id', id);
        if (error) return { message: `Failed to update player: ${error.message}` };
        successMessage = 'Player_updated_successfully'; // 2. Set update message
    } else {
        // Create logic
        const spaceId = formData.get('spaceId');
        const { error } = await supabase.from('players').insert({ ...rawData, space_id: spaceId });
        if (error) return { message: `Failed to add player: ${error.message}` };
        successMessage = 'Player_added_successfully'; // 3. Set create message
    }

    // revalidatePath(ROSTER_PATH);
    revalidatePath(ROSTER_PATH);
    return { isSuccess: true, message: successMessage };
    // redirect(`${ROSTER_PATH}?message=${successMessage}`);

}

export async function deletePlayer(prevState, formData) {
    const supabase = await createClient();
    const id = formData.get('id');

    const { error } = await supabase.from('players').delete().eq('id', id);

    if (error) {
        // Handle error, maybe redirect with an error message
        console.error('Delete player error:', error);
        revalidatePath(ROSTER_PATH);
        return { isSuccess: false, message: 'Error deleting player' };
        // redirect(`${ROSTER_PATH}?message=Error_deleting_player`);
    }

    // revalidatePath(ROSTER_PATH);
    revalidatePath(ROSTER_PATH);
    return { isSuccess: true, message: 'Player deleted successfully' };
    // redirect(`${ROSTER_PATH}?message=Player_deleted_successfully`);
}