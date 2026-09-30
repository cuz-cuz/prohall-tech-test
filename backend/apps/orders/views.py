from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import CheckoutSerializer, OrderSerializer
from .services import CheckoutConflict, checkout_order


class CheckoutView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            order, replayed = checkout_order(serializer.validated_data)
        except CheckoutConflict as exc:
            return Response(exc.as_response(), status=status.HTTP_409_CONFLICT)

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_200_OK if replayed else status.HTTP_201_CREATED,
        )
