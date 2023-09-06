# noff/routing.py (project level)

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

from ..timer import routing

application = ProtocolTypeRouter({
 # (http->django views is added by default)
 'websocket': AuthMiddlewareStack(
 URLRouter(
    routing.websocket_urlpatterns
 )
 ),
})
