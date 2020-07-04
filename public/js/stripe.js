/* eslint-disable */

import Axios from "axios";
import { showAlert } from './alert';

const stripe = Stripe('pk_test_51Gza0KIxnngy6x5C89rZ37kzZJtewUSCrVvd7JPxmYXLo9rYlq4C9mi0sNZL3lrglFNX14S59nv7AUXrDpVnkCmK00YZ3UEg1H');

export const bookTour = async tourId => {
    try {
        // Get checkout session from server
        const session = await Axios(`/api/v1/bookings/checkout-session/${tourId}`);

        // Create checkout form + charge CC
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });

    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
}